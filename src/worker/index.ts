import { Hono } from "hono";
import { cors } from 'hono/cors'

const app = new Hono<{ Bindings: Env }>();

app.use('/api/*', cors())

app.get("/api/config", (c) => {
    return c.json({
        siteKey: c.env.TURNSTILE_SITE_KEY
    });
});

app.get("/api/", (c) => {
    return c.json({ status: "ok", service: "URL Shortener API" });
});

// Shorten URL Endpoint
app.post("/api/shorten", async (c) => {
    const { url, slug, turnstileToken } = await c.req.json<{ url: string, slug?: string, turnstileToken: string }>();

    if (!url || !turnstileToken) {
        return c.json({ error: "Missing URL or Turnstile Token" }, 400);
    }

    // Verify Turnstile
    const tr = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            secret: c.env.TURNSTILE_SECRET_KEY,
            response: turnstileToken,
        }),
    });

    const trResult = await tr.json() as { success: boolean };
    if (!trResult.success) {
        return c.json({ error: "Invalid Turnstile Token" }, 403);
    }

    // Generate or use provided slug
    let finalSlug = slug;
    if (!finalSlug) {
        // Simple random generation (retry if collision, but keeping it simple for now)
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        finalSlug = '';
        for (let i = 0; i < 6; i++) {
            finalSlug += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    }

    // Insert into D1
    try {
        await c.env.D1.prepare("INSERT INTO urls (original_url, short_code) VALUES (?, ?)")
            .bind(url, finalSlug)
            .run();

        // Return full URL assuming same domain for now, or just the slug
        return c.json({ slug: finalSlug, shortUrl: finalSlug });
    } catch (e: any) {
        if (e.message.includes('UNIQUE constraint failed')) {
            return c.json({ error: "Slug already in use" }, 409);
        }
        return c.json({ error: "Database error" }, 500);
    }
});

// Bulk Stats Endpoint
app.post("/api/stats", async (c) => {
    const { slugs } = await c.req.json<{ slugs: string[] }>();

    if (!slugs || !Array.isArray(slugs) || slugs.length === 0) {
        return c.json({ stats: [] });
    }

    // Construct placeholders: ?,?,?
    const placeholders = slugs.map(() => '?').join(',');
    const query = `SELECT short_code, clicks FROM urls WHERE short_code IN (${placeholders})`;

    try {
        const { results } = await c.env.D1.prepare(query)
            .bind(...slugs)
            .all<{ short_code: string, clicks: number }>();

        return c.json({ stats: results || [] });
    } catch (e) {
        console.error(e);
        return c.json({ error: "Failed to fetch stats" }, 500);
    }
});

// Redirect Endpoint
app.get("/:slug", async (c) => {
    const slug = c.req.param("slug");
    console.log(`[Worker] Received request for slug: ${slug}`);

    // Ignore favicon or other assets
    if (slug.includes('.')) {
        console.log(`[Worker] Ignoring asset-like slug: ${slug}`);
        return c.notFound();
    }

    const result = await c.env.D1.prepare("SELECT original_url FROM urls WHERE short_code = ?")
        .bind(slug)
        .first<{ original_url: string }>();

    if (result) {
        // Async update clicks (fire and forget)
        c.executionCtx.waitUntil(
            c.env.D1.prepare("UPDATE urls SET clicks = clicks + 1 WHERE short_code = ?").bind(slug).run()
        );

        // Return HTML with Loading Spinner and JS Redirect
        return c.html(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Redirecting...</title>
                <style>
                    body {
                        margin: 0;
                        height: 100vh;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        background-color: #1a1a1a; 
                        color: #e0e0e0;
                        font-family: 'Inter', sans-serif;
                        flex-direction: column;
                        overflow: hidden;
                    }
                    .loader {
                        width: 48px;
                        height: 48px;
                        border: 5px solid #333;
                        border-bottom-color: #d4a373; /* Earthy accent */
                        border-radius: 50%;
                        display: inline-block;
                        box-sizing: border-box;
                        animation: rotation 1s linear infinite;
                        margin-bottom: 24px;
                    }
                    p {
                        font-size: 1.1rem;
                        color: #888;
                        animation: pulse 1.5s ease-in-out infinite;
                    }
                    @keyframes rotation {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    @keyframes pulse {
                        0% { opacity: 0.6; }
                        50% { opacity: 1; }
                        100% { opacity: 0.6; }
                    }
                </style>
            </head>
            <body>
                <span class="loader"></span>
                <p>Redirecting you...</p>
                <script>
                    setTimeout(() => {
                        window.location.href = "${result.original_url}";
                    }, 1500);
                </script>
            </body>
            </html>
        `);
    }

    return c.json({ error: "URL not found" }, 404);
});

export default app;
