import { useState, useEffect } from 'react'

type HealthState =
  | { phase: 'loading' }
  | { phase: 'ok'; timestamp: string }
  | { phase: 'error' }

export default function App() {
  const [health, setHealth] = useState<HealthState>({ phase: 'loading' })

  useEffect(() => {
    let ignore = false
    fetch('/api/health')
      .then(res => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then(data => {
        if (!ignore) setHealth({ phase: 'ok', timestamp: data.timestamp })
      })
      .catch(() => {
        if (!ignore) setHealth({ phase: 'error' })
      })
    return () => { ignore = true }
  }, [])

  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: 480 }}>
      <h1>Daily Task App</h1>
      <HealthBanner health={health} />
    </main>
  )
}

function HealthBanner({ health }: { health: HealthState }) {
  const styles: Record<string, React.CSSProperties> = {
    base: {
      marginTop: '1rem',
      padding: '0.75rem 1rem',
      borderRadius: 8,
      fontSize: 14,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    },
    loading: { background: '#f0f0f0', color: '#555' },
    ok:      { background: '#e6f4ea', color: '#1e7e34' },
    error:   { background: '#fdecea', color: '#c0392b' },
  }

  if (health.phase === 'loading') {
    return (
      <div style={{ ...styles.base, ...styles.loading }}>
        <span>⏳</span> Connecting to server…
      </div>
    )
  }

  if (health.phase === 'error') {
    return (
      <div style={{ ...styles.base, ...styles.error }}>
        <span>✗</span> Could not reach the server. Make sure the API is running on port 3001.
      </div>
    )
  }

  return (
    <div style={{ ...styles.base, ...styles.ok }}>
      <span>✓</span>
      <span>
        Server connected —{' '}
        <span style={{ opacity: 0.7 }}>
          {new Date(health.timestamp).toLocaleTimeString()}
        </span>
      </span>
    </div>
  )
}
