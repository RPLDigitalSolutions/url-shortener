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
