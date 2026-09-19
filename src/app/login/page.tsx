'use client'

import './login.css'

import { useActionState } from 'react'
import { loginAction } from './actions'
import { Eye, EyeOff, Phone, Lock, Loader2 } from 'lucide-react'
import { useState } from 'react'

const initialState: { error?: string } = {}

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="login-root">
      {/* Background orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <main className="login-container">
        {/* Logo / branding */}
        <div className="brand">
          <div className="brand-icon">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="20" cy="20" r="18" stroke="url(#grad)" strokeWidth="3" />
              <path d="M14 20 L20 13 L26 20 L20 27 Z" fill="url(#grad)" />
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="brand-name">Game<span>Point</span></h1>
          <p className="brand-tagline">Sports Academy Management</p>
        </div>

        {/* Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Welcome back</h2>
            <p className="card-subtitle">Sign in to your account</p>
          </div>

          <form action={formAction} className="login-form" id="login-form">
            {/* Phone field */}
            <div className="field-group">
              <label htmlFor="phone" className="field-label">Phone Number</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <Phone size={17} />
                </span>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  placeholder="Enter your phone number"
                  className="field-input"
                  disabled={isPending}
                />
              </div>
            </div>

            {/* Password field */}
            <div className="field-group">
              <label htmlFor="password" className="field-label">Password</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <Lock size={17} />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  className="field-input field-input--password"
                  disabled={isPending}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={0}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {state?.error && (
              <div className="error-banner" role="alert" aria-live="assertive">
                <span className="error-dot" />
                {state.error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              id="login-submit"
              className="submit-btn"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 size={18} className="spin" />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="card-footer-note">
            No account? Contact your administrator.
          </p>
        </div>
      </main>
    </div>
  )
}
