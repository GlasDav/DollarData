import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, TrendingUp, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");
    const { resetPassword } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        try {
            await resetPassword(email);
            setSubmitted(true);
        } catch (err) {
            const detail = err.response?.data?.detail;
            if (typeof detail === 'string') {
                setError(detail);
            } else {
                setError("An error occurred. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface dark:bg-surface-dark flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-light/20 rounded-full blur-3xl"></div>
            </div>

            <div className="bg-card dark:bg-card-dark p-8 rounded-3xl shadow-2xl border border-border dark:border-border-dark w-full max-w-md relative z-10 transition-colors duration-300">
                {/* Logo and branding */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 shadow-lg shadow-primary/30">
                        <TrendingUp className="text-white" size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-text-primary dark:text-text-primary-dark mb-2">
                        Reset Password
                    </h1>
                    <p className="text-text-muted">
                        {submitted
                            ? "Check your email for instructions"
                            : "Enter your email to receive a reset link"
                        }
                    </p>
                </div>

                {error && (
                    <div className="bg-accent-error/20 text-accent-error p-3 rounded-xl mb-6 text-sm text-center border border-accent-error/30">
                        {error}
                    </div>
                )}

                {submitted ? (
                    <div className="space-y-6">
                        <div className="bg-accent-success/10 text-accent-success p-4 rounded-xl text-sm text-center border border-accent-success/20">
                            <p className="mb-2">✓ Password reset email sent!</p>
                            <p className="text-accent-success/70 text-xs">
                                If an account exists with this email, you'll receive a link to reset your password.
                            </p>
                        </div>
                        <Link
                            to="/login"
                            className="flex items-center justify-center gap-2 w-full bg-surface dark:bg-surface-dark border border-border dark:border-border-dark text-text-primary dark:text-text-primary-dark font-medium py-3 rounded-xl transition-all hover:bg-surface-hover dark:hover:bg-surface-dark-hover"
                        >
                            <ArrowLeft size={18} />
                            Back to Login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-2">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-3 text-text-muted group-focus-within:text-primary transition-colors" size={20} />
                                <input
                                    type="email"
                                    className="w-full pl-10 pr-4 py-3 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-text-primary dark:text-text-primary-dark placeholder-text-muted/50"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Sending...
                                </span>
                            ) : 'Send Reset Link'}
                        </button>

                        <div className="text-center">
                            <Link
                                to="/login"
                                className="text-sm text-primary hover:text-primary-hover transition-colors"
                            >
                                ← Back to Login
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
