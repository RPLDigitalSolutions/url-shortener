import { useState, useEffect } from 'react';
import ShortenerCard from './components/ShortenerCard';
import HistoryList, { HistoryItem } from './components/HistoryList';
import useLocalStorage from './hooks/useLocalStorage';
import './App.css';

function App() {
	const [history, setHistory] = useLocalStorage<HistoryItem[]>('url-history', []);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [turnstileSiteKey, setTurnstileSiteKey] = useState<string>("");

	// Fetch Config from Worker (Cloudflare Env Var)
	useEffect(() => {
		fetch("/api/config")
			.then(res => res.json())
			.then((data: any) => {
				if (data.siteKey) setTurnstileSiteKey(data.siteKey);
			})
			.catch(err => console.error("Failed to load config:", err));
	}, []);

	// Sync Stats
	useEffect(() => {
		if (history.length === 0) return;

		const slugs = history.map(h => {
			const parts = h.shortUrl.split('/');
			return parts[parts.length - 1]; // Get slug from URL
		});

		fetch("/api/stats", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ slugs })
		})
			.then(res => res.json())
			.then((data: { stats: { short_code: string, clicks: number }[] }) => {
				if (data.stats && Array.isArray(data.stats)) {
					const statsMap = new Map(data.stats.map(s => [s.short_code, s.clicks]));

					let hasChanges = false;
					const newHistory = history.map(item => {
						const slug = item.shortUrl.split('/').pop() || "";
						if (statsMap.has(slug)) {
							const serverClicks = statsMap.get(slug);
							if (serverClicks !== item.clicks) {
								hasChanges = true;
								return { ...item, clicks: serverClicks };
							}
						}
						return item;
					});

					if (hasChanges) {
						console.log("Updated stats from server");
						setHistory(newHistory);
					}
				}
			})
			.catch(err => console.error("Failed to sync stats:", err));
	}, [history.length]); // Only run when history count changes (added/removed), or empty dependency if we want just once on mount. 
	// Ideally we might want a manual refresh or run on mount. `history.length` is a safe compromise to update when new items are added efficiently, but doesn't auto-poll.
	// To fix "refresh dashboard" specifically: `[]` (mount) is critical. But since history is loaded from localStorage, we need to wait for it? 
	// useLocalStorage initializes synchronously so `history` is ready on mount.
	// But we also want to re-check if user adds a new link? The response from shorten API normally returns 0 clicks anyway.
	// So [] is best for "refresh".
	// Wait, useLocalStorage returns [storedValue, setValue].

	// Better strategy: Run on mount.
	// But we need to use `history` in `useEffect`. so `[history]` would cause infinite loop if we update history inside.
	// Solution: Break loop by checking equality (implemented above) and strict dependency management.
	// Or just run once on mount? But history might change.
	// Let's rely on standard reload for now (useEffect has `[]` but we need `history` in scope/dependency).
	// Actually, if we put `history` in dependency and verify changes, it works.


	const handleShorten = async (url: string, customCode: string, turnstileToken: string) => {
		try {
			setIsLoading(true);
			setError(null);

			const response = await fetch("/api/shorten", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					url,
					slug: customCode,
					turnstileToken,
				}),
			});

			const data = await response.json() as { slug?: string; shortUrl?: string; error?: string };

			if (!response.ok) {
				throw new Error(data.error || "Failed to shorten URL");
			}

			const code = data.slug!;
			// Construct the URL based on the current location origin if shortUrl is just slug, 
			// or use data.shortUrl if the backend sends full URL.
			// Backend currently returns { slug: finalSlug, shortUrl: finalSlug }
			const shortUrl = `${window.location.origin}/${code}`;

			const newItem: HistoryItem = {
				id: Date.now().toString(),
				originalUrl: url,
				shortUrl: shortUrl,
				date: new Date().toLocaleDateString(),
				clicks: 0,
			};

			const updatedHistory = [newItem, ...history];
			setHistory(updatedHistory);
			// localStorage is handled by hook, but ensure it updates state which updates hook

			// Auto copy
			try {
				await navigator.clipboard.writeText(shortUrl);
				// alert("Copied!"); 
			} catch (err) {
				console.error("Failed to copy", err);
			}

		} catch (err: any) {
			console.error(err);
			alert(err.message || "Something went wrong");
			setError(err.message);
		} finally {
			setIsLoading(false);
		}
	};

	const handleDelete = (id: string) => {
		setHistory(history.filter(item => item.id !== id));
	};

	return (
		<div className="app-container" style={{
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			padding: '2rem 1rem',
			minHeight: '100vh',
		}}>
			<header style={{ marginBottom: '3rem', textAlign: 'center' }}>
				<h1 style={{
					fontSize: '2.5rem',
					fontWeight: 800,
					background: 'linear-gradient(to right, var(--text-primary), var(--accent-primary))',
					WebkitBackgroundClip: 'text',
					WebkitTextFillColor: 'transparent',
					backgroundColor: 'var(--text-primary)',
					letterSpacing: '-0.02em',
					marginBottom: '0.5rem'
				}}>
					ShortLink
				</h1>
				<p style={{ color: 'var(--text-secondary)' }}>
					Premium URL Shortener
				</p>
			</header>

			<main style={{
				width: '100%',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center'
			}}>
				<ShortenerCard onShorten={handleShorten} siteKey={turnstileSiteKey} />

				{isLoading && <p style={{ marginTop: '1rem', color: 'var(--accent-primary)' }}>Shortening...</p>}
				{error && <p style={{ marginTop: '1rem', color: 'red' }}>{error}</p>}

				<HistoryList history={history} onDelete={handleDelete} />
			</main>

			<footer style={{
				marginTop: 'auto',
				paddingTop: '3rem',
				color: 'var(--accent-dark)',
				fontSize: '0.8rem',
				opacity: 0.5
			}}>
				&copy; {new Date().getFullYear()} Character Theme Inc.
			</footer>
		</div>
	);
}

export default App;
