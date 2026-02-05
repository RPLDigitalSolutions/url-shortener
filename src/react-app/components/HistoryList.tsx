import React from 'react';
import { Copy, Check, Trash2, ExternalLink } from 'lucide-react';

export interface HistoryItem {
    id: string;
    originalUrl: string;
    shortUrl: string;
    date: string;
    clicks?: number;
}

interface HistoryListProps {
    history: HistoryItem[];
    onDelete: (id: string) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ history, onDelete }) => {
    const [copiedId, setCopiedId] = React.useState<string | null>(null);

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    if (history.length === 0) return null;

    return (
        <div style={{
            marginTop: '2rem',
            width: '100%',
            maxWidth: '500px',
        }}>
            <h3 style={{
                color: 'var(--text-secondary)',
                marginBottom: '1rem',
                fontSize: '1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
            }}>
                Recent Links
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {history.map((item) => (
                    <div key={item.id} style={{
                        backgroundColor: 'var(--bg-card)',
                        padding: '1rem',
                        borderRadius: '12px',
                        border: '1px solid var(--accent-metallic)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        transition: 'border-color 0.2s'
                    }}>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{
                                color: 'var(--accent-primary)',
                                fontWeight: 'bold',
                                fontSize: '1.1rem',
                                marginBottom: '0.25rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                {item.shortUrl.replace('https://', '')}
                                <a href={item.shortUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', display: 'flex' }}>
                                    <ExternalLink size={14} style={{ opacity: 0.5 }} />
                                </a>
                            </div>
                            <div style={{
                                color: 'var(--text-secondary)',
                                fontSize: '0.85rem',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>
                                {item.originalUrl}
                            </div>
                            <div style={{
                                color: 'var(--text-secondary)',
                                fontSize: '0.75rem',
                                marginTop: '0.4rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                opacity: 0.8
                            }}>
                                <span>{item.date}</span>
                                {item.clicks !== undefined && (
                                    <>
                                        <span>•</span>
                                        <span>{item.clicks} clicks</span>
                                    </>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={() => handleCopy(item.shortUrl, item.id)}
                                title="Copy"
                                style={{
                                    backgroundColor: copiedId === item.id ? 'var(--accent-primary)' : 'var(--bg-accent)',
                                    color: copiedId === item.id ? '#fff' : 'var(--text-primary)',
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'background-color 0.2s'
                                }}
                            >
                                {copiedId === item.id ? <Check size={18} /> : <Copy size={18} />}
                            </button>
                            <button
                                onClick={() => onDelete(item.id)}
                                title="Delete"
                                style={{
                                    backgroundColor: 'transparent',
                                    color: 'var(--text-secondary)',
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px solid var(--bg-accent)'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.color = '#ff4d4d'}
                                onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HistoryList;
