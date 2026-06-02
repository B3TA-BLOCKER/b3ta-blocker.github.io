'use client'

export default function NewsletterForm() {
  return (
    <div style={{ borderTop: '1px solid #21262d', paddingTop: '2rem', marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <div style={{ marginBottom: '1rem' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#e53e3e', marginBottom: '0.5rem' }}>
          Newsletter
        </p>
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
          Get notified on new posts
        </h3>
        <p style={{ fontSize: '13px', color: '#8b949e' }}>
          No spam. Just writeups, walkthroughs, and notes — straight to your inbox.
        </p>
      </div>
      <form action="https://buttondown.com/api/emails/embed-subscribe/B3TA_BLOCKER" method="post" style={{ display: 'flex', gap: '8px', maxWidth: '480px', width: '100%' }}>
        <input type="email" name="email" id="bd-email" placeholder="your@email.com" required style={{ flex: 1, background: '#0d1117', border: '1px solid #30363d', borderRadius: '6px', padding: '8px 14px', color: '#c9d1d9', fontFamily: 'var(--font-mono)', fontSize: '13px', outline: 'none' }} />
        <input type="submit" value="Subscribe" style={{ background: 'transparent', border: '1px solid #e53e3e', borderRadius: '6px', padding: '8px 20px', color: '#e53e3e', fontFamily: 'var(--font-mono)', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }} />
      </form>
      <p style={{ marginTop: '8px', fontSize: '10px', color: '#484f58' }}>
        Powered by{' '}
        <a href="https://buttondown.com/refer/B3TA_BLOCKER" target="_blank" rel="noreferrer" style={{ color: '#484f58', textDecoration: 'none' }}>
          Buttondown
        </a>
      </p>
    </div>
  )
}
