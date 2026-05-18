import React from 'react'

function AdminLogin({ email, secretKey, loading, error, onEmailChange, onSecretKeyChange, onSubmit }) {
  return (
    <section className="admin-login">
      <div className="admin-login__card">
        <p className="admin-kicker">Admin access</p>
        <h1>Sign in to continue</h1>
        <p className="admin-login__note">Use the admin email and secret key to unlock the dashboard.</p>

        <form className="admin-login__form" onSubmit={onSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder="admin@gmail.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Secret key
            <input
              type="password"
              value={secretKey}
              onChange={(event) => onSecretKeyChange(event.target.value)}
              placeholder="Enter your secret key"
              autoComplete="current-password"
              required
            />
          </label>

          {error ? <div className="admin-login__error">{error}</div> : null}

          <button type="submit" className="admin-login__submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </section>
  )
}

export default AdminLogin
