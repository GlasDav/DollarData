import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Shield, Lock, Zap, PieChart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

// Reusable Components
const FeatureCard = ({ title, description, image, delay }) => (
    <div className={`bg-card dark:bg-card-dark rounded-3xl p-6 shadow-sm border border-border dark:border-border-dark hover:shadow-md transition-all duration-300 group overflow-hidden relative fade-in-up delay-${delay}`}>
        <div className="relative z-10">
            <h3 className="text-xl font-bold text-text-primary dark:text-text-primary-dark mb-2">{title}</h3>
            <p className="text-text-muted dark:text-text-muted-dark text-sm leading-relaxed">{description}</p>
        </div>
        <div className="mt-6 rounded-xl overflow-hidden bg-surface dark:bg-surface-dark border border-border dark:border-border-dark h-48 group-hover:scale-[1.02] transition-transform duration-500">
            <img src={image} alt={title} className="w-full h-full object-cover" />
        </div>
    </div>
);

export default function LandingPage() {
    const navigate = useNavigate();
    const { user, loading } = useAuth();

    useEffect(() => {
        // Redirect authenticated users to dashboard
        if (!loading && user) {
            navigate('/dashboard');
        }
    }, [user, loading, navigate]);

    if (loading) return null; // Prevent flash while checking auth

    return (
        <div className="min-h-screen bg-surface dark:bg-surface-dark font-sans selection:bg-primary/20">
            {/* Navigation */}
            <nav className="fixed top-0 w-full bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-md z-50 border-b border-border dark:border-border-dark">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center">
                            <img src="/brand-logo.svg" alt="DollarData" className="h-8 w-auto dark:hidden" />
                            <img src="/brand-logo-dark.svg" alt="DollarData" className="h-8 w-auto hidden dark:block" />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="text-text-muted dark:text-text-muted-dark hover:text-primary font-medium text-sm transition-colors"
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => navigate('/register')}
                            className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40"
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
                    <div className="text-center lg:text-left space-y-8 max-w-2xl mx-auto lg:mx-0">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 text-primary text-sm font-semibold border border-primary/10 animate-fade-in">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            v2.0 is now live
                        </div>

                        <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-text-primary dark:text-text-primary-dark leading-[1.1]">
                            Master your money <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
                                with precision.
                            </span>
                        </h1>

                        <p className="text-xl text-text-muted dark:text-text-muted-dark leading-relaxed max-w-lg mx-auto lg:mx-0">
                            DollarData consolidates your entire financial life into one beautiful, intelligent dashboard. Track net worth, analyze spending, and build wealth.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                            <button
                                onClick={() => navigate('/register')}
                                className="w-full sm:w-auto px-8 py-4 bg-text-primary dark:bg-white text-surface dark:text-text-primary rounded-full font-bold text-lg hover:translate-y-[-2px] transition-all shadow-xl dark:shadow-white/10"
                            >
                                Start Free Trial
                            </button>
                            <button
                                onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                                className="w-full sm:w-auto px-8 py-4 bg-card dark:bg-card-dark border border-border dark:border-border-dark text-text-primary dark:text-text-primary-dark rounded-full font-semibold text-lg hover:bg-surface dark:hover:border-primary/50 transition-all flex items-center justify-center gap-2"
                            >
                                See Features <ArrowRight size={20} />
                            </button>
                        </div>

                        <div className="pt-8 border-t border-border dark:border-border-dark flex items-center justify-center lg:justify-start gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                            <span className="text-sm font-semibold text-text-muted uppercase tracking-widest">Trusted by efficient investors</span>
                        </div>
                    </div>

                    <div className="relative lg:h-[800px] flex items-center justify-center perspective-1000">
                        {/* 3D Dashboard Image */}
                        <div className="relative z-10 transform transition-transform duration-700 hover:scale-[1.01] hover:rotate-1">
                            <img
                                src="/landing/web_dashboard_hero.png"
                                alt="DollarData Dashboard"
                                className="rounded-xl shadow-2xl border border-border dark:border-border-dark w-full max-w-[800px]"
                            />
                            {/* Glow effect */}
                            <div className="absolute -inset-10 bg-gradient-to-tr from-primary/20 to-purple-500/20 blur-3xl -z-10 rounded-full opacity-70"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid (Bento) */}
            <section id="features" className="py-24 bg-surface dark:bg-surface-dark border-t border-border dark:border-border-dark">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl lg:text-4xl font-bold text-text-primary dark:text-text-primary-dark mb-4">Complete Financial Clarity</h2>
                        <p className="text-text-muted dark:text-text-muted-dark text-lg">Everything you need to manage your wealth, built for the modern investor.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            title="Visualize Flows"
                            description="See exactly where every dollar goes. Our interactive Sankey diagrams make complex financial data instantly intuitive."
                            image="/landing/sankey_flow_3d.png"
                            delay="100"
                        />
                        <FeatureCard
                            title="Smart Budgeting"
                            description="Set custom limits, track categories in real-time, and crush your savings goals with intelligent budget cards."
                            image="/landing/budget_smart_card.png"
                            delay="200"
                        />
                        <FeatureCard
                            title="Net Worth Tracking"
                            description="Monitor your assets, liabilities, and overall growth with beautiful, data-rich charts and breakdown reports."
                            image="/landing/net_worth_growth_chart.png"
                            delay="300"
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-6">
                <div className="max-w-5xl mx-auto bg-gradient-to-r from-indigo-600 to-purple-600 rounded-[3rem] p-12 lg:p-20 text-center relative overflow-hidden shadow-2xl shadow-indigo-500/30">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 bg-repeat mix-blend-overlay"></div>

                    <div className="relative z-10 space-y-8">
                        <h2 className="text-4xl lg:text-5xl font-bold text-white tracking-tight">
                            Ready to take control?
                        </h2>
                        <p className="text-indigo-100 text-xl max-w-xl mx-auto">
                            Join thousands of Australians using DollarData to build their wealth intentionally.
                        </p>
                        <button
                            onClick={() => navigate('/register')}
                            className="bg-card text-primary hover:bg-surface px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg hover:scale-105"
                        >
                            Open Free Account
                        </button>
                        <p className="text-indigo-200 text-sm mt-4">No credit card required for trial.</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-border dark:border-border-dark bg-card dark:bg-card-dark">
                <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-10">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <img src="/brand-logo.svg" alt="DollarData" className="h-6 w-auto dark:hidden opacity-80" />
                            <img src="/brand-logo-dark.svg" alt="DollarData" className="h-6 w-auto hidden dark:block opacity-80" />
                        </div>
                        <p className="text-text-muted dark:text-text-muted-dark text-sm leading-relaxed max-w-xs">
                            DollarData is an independent financial platform designed to help you organize, track, and grow your wealth.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-semibold text-text-primary dark:text-text-primary-dark mb-4">Product</h4>
                        <ul className="space-y-3 text-sm text-text-muted dark:text-text-muted-dark">
                            <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Roadmap</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-text-primary dark:text-text-primary-dark mb-4">Legal</h4>
                        <ul className="space-y-3 text-sm text-text-muted dark:text-text-muted-dark">
                            <li><button onClick={() => navigate('/privacy')} className="hover:text-primary transition-colors">Privacy Policy</button></li>
                            <li><button onClick={() => navigate('/terms')} className="hover:text-primary transition-colors">Terms of Service</button></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-border dark:border-border-dark text-center md:text-left text-sm text-text-muted">
                    &copy; {new Date().getFullYear()} DollarData. All rights reserved.
                </div>
            </footer>
        </div>
    );
}
