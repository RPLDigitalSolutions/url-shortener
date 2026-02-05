import React, { useState } from 'react';
import { Link, ArrowRight } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';

interface ShortenerCardProps {
    onShorten: (original: string, code: string, token: string) => void;
    siteKey: string;
}

const ShortenerCard: React.FC<ShortenerCardProps> = ({ onShorten, siteKey }) => {
    const [url, setUrl] = useState('');
    const [customCode, setCustomCode] = useState('');
    const [token, setToken] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;
        if (!token) {
            alert('Please complete the verification.');
            return;
        }

        // Pass url, code, AND token
        onShorten(url, customCode, token);
        setUrl('');
        setCustomCode('');
        // Token reused or reset depending on preference. 
        // Typically turnstile needs reset after use, but let's assume valid for one submission
    };

    return (
        <div style={{
            backgroundColor: 'var(--bg-card)',
            padding: '2rem',
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            width: '100%',
            maxWidth: '500px',
            border: '1px solid var(--accent-metallic)'
        }}>
            <h2 style={{
                color: 'var(--text-primary)',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '1.5rem',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
            }}>
                <Link size={24} color="var(--accent-primary)" />
                Shorten Your Link
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                    <label style={{
                        display: 'block',
                        color: 'var(--text-secondary)',
                        marginBottom: '0.5rem',
                        fontSize: '0.9rem'
                    }}>
                        Long URL
                    </label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="url"
                            placeholder="https://example.com/very-long-url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                backgroundColor: 'var(--bg-main)',
                                border: '1px solid var(--accent-metallic)',
                                borderRadius: '8px',
                                color: 'var(--text-primary)',
                                fontSize: '1rem',
                                transition: 'border-color 0.2s',
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--accent-metallic)'}
                        />
                    </div>
                </div>

                <div>
                    <label style={{
                        display: 'block',
                        color: 'var(--text-secondary)',
                        marginBottom: '0.5rem',
                        fontSize: '0.9rem'
                    }}>
                        Custom Shortcode (Optional)
                    </label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            placeholder="my-link"
                            value={customCode}
                            onChange={(e) => setCustomCode(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                backgroundColor: 'var(--bg-main)',
                                border: '1px solid var(--accent-metallic)',
                                borderRadius: '8px',
                                color: 'var(--text-primary)',
                                fontSize: '1rem',
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--accent-metallic)'}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', margin: '0.5rem 0' }}>
                    {siteKey && (
                        <Turnstile
                            siteKey={siteKey}
                            onSuccess={(token) => setToken(token)}
                            options={{ theme: 'dark' }} // Matches our theme
                        />
                    )}
                </div>

                <button
                    type="submit"
                    disabled={!token}
                    style={{
                        marginTop: '0.5rem',
                        backgroundColor: !token ? 'var(--bg-accent)' : 'var(--accent-primary)',
                        color: '#fff',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'transform 0.1s, opacity 0.2s',
                        cursor: !token ? 'not-allowed' : 'pointer',
                        opacity: !token ? 0.5 : 1
                    }}
                    onMouseDown={(e) => !token ? null : e.currentTarget.style.transform = 'scale(0.98)'}
                    onMouseUp={(e) => !token ? null : e.currentTarget.style.transform = 'scale(1)'}
                    onMouseOver={(e) => !token ? null : e.currentTarget.style.opacity = '0.9'}
                    onMouseOut={(e) => !token ? null : e.currentTarget.style.opacity = '1'}
                >
                    Shorten <ArrowRight size={18} />
                </button>
            </form>
        </div>
    );
};

export default ShortenerCard;
