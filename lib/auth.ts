/**
 * Authentication API Client
 * 
 * Provides functions to interact with PayloadCMS authentication endpoints.
 */

const API_URL = process.env.NEXT_PUBLIC_PAYLOAD_API_URL || 'http://localhost:3000'

export interface User {
  id: string
  email: string
  name: string
  role: 'superadmin' | 'admin' | 'editor' | 'viewer'
  emailVerified?: boolean
  picture?: string
}

export interface AuthResponse {
  user: User
  token: string
  exp: number
}

export interface LoginData {
  email: string
  password: string
}

/**
 * Login with email and password
 */
export async function login(data: LoginData): Promise<{ success: boolean; user?: User; message?: string }> {
  try {
    const response = await fetch(`${API_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        message: errorData.errors?.[0]?.message || 'Invalid email or password'
      }
    }

    const result: AuthResponse = await response.json()

    // Store token in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('payload_token', result.token)
    }

    return { success: true, user: result.user }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, message: 'Network error. Please try again.' }
  }
}

/**
 * Logout current user
 */
export async function logout(): Promise<void> {
  try {
    await fetch(`${API_URL}/api/users/logout`, {
      method: 'POST',
      credentials: 'include',
    })
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('payload_token')
    }
  }
}

/**
 * Get current user from stored token
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('payload_token') : null

    const response = await fetch(`${API_URL}/api/users/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `JWT ${token}` } : {}),
      },
      credentials: 'include',
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.user || null
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}

/**
 * Request password reset
 */
export async function forgotPassword(email: string): Promise<{ success: boolean; message?: string }> {
  try {
    await fetch(`${API_URL}/api/users/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    // Always return success to prevent email enumeration
    return { success: true, message: 'If an account exists, you will receive a reset email.' }
  } catch (error) {
    console.error('Forgot password error:', error)
    return { success: false, message: 'Network error. Please try again.' }
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, password: string): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${API_URL}/api/custom-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.message || 'Invalid or expired reset link' }
    }

    return { success: true, message: 'Password reset successfully!' }
  } catch (error) {
    console.error('Reset password error:', error)
    return { success: false, message: 'Network error. Please try again.' }
  }
}
