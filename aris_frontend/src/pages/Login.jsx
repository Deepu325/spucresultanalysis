import React, { useState } from 'react';

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const DEFAULT_EMAIL = 'spuc_admin@soundarya.edu';
    const DEFAULT_PASSWORD = 'Soundarya@2026';

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        setTimeout(() => {
            if (email === DEFAULT_EMAIL && password === DEFAULT_PASSWORD) {
                localStorage.setItem('authToken', btoa(`${email}:${password}`));
                localStorage.setItem('userEmail', email);
                localStorage.removeItem('cachedData');
                sessionStorage.clear();
                onLogin();
            } else {
                setError('Invalid email or password');
            }
            setLoading(false);
        }, 500);
    };

    return (
        <div style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: '#ffffff',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                padding: '40px',
                width: '100%',
                maxWidth: '400px'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h1 style={{ 
                        color: '#000000', 
                        fontSize: '28px', 
                        margin: '0 0 8px 0',
                        fontWeight: '700'
                    }}>
                        SPUC ARIS
                    </h1>
                    <p style={{ 
                        color: '#4a5568', 
                        margin: '0',
                        fontSize: '14px'
                    }}>
                        Academic Results Information System
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '6px',
                            color: '#000000',
                            fontWeight: '500',
                            fontSize: '14px'
                        }}>
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={DEFAULT_EMAIL}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '14px',
                                boxSizing: 'border-box',
                                backgroundColor: '#f9fafb',
                                color: '#000000',
                                transition: 'border-color 0.2s, background-color 0.2s',
                                outline: 'none'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#3b82f6';
                                e.target.style.backgroundColor = '#ffffff';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#d1d5db';
                                e.target.style.backgroundColor = '#f9fafb';
                            }}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '6px',
                            color: '#000000',
                            fontWeight: '500',
                            fontSize: '14px'
                        }}>
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                style={{
                                    width: '100%',
                                    padding: '10px 40px 10px 12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    boxSizing: 'border-box',
                                    backgroundColor: '#f9fafb',
                                    color: '#000000',
                                    transition: 'border-color 0.2s, background-color 0.2s',
                                    outline: 'none'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#3b82f6';
                                    e.target.style.backgroundColor = '#ffffff';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#d1d5db';
                                    e.target.style.backgroundColor = '#f9fafb';
                                }}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#6b7280',
                                    fontSize: '18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '4px',
                                    transition: 'color 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.color = '#000000';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.color = '#6b7280';
                                }}
                            >
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            padding: '10px 12px',
                            backgroundColor: '#fee2e2',
                            border: '1px solid #fecaca',
                            borderRadius: '6px',
                            color: '#991b1b',
                            fontSize: '13px',
                            marginBottom: '16px'
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '10px',
                            backgroundColor: '#000000',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) e.target.style.backgroundColor = '#333333';
                        }}
                        onMouseLeave={(e) => {
                            if (!loading) e.target.style.backgroundColor = '#000000';
                        }}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
