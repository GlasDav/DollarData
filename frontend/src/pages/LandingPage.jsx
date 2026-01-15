import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Shield, TrendingUp, DollarSign, Award, Lock, Layout, PieChart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Helper for zig-zag feature sections
const FeatureSection = ({ title, description, image, icon: Icon, reversed = false }) => (
    <div className="py-24 px-6 border-t border-border dark:border-border-dark overflow-hidden">
        <div className="max-w-7xl mx-auto">
            <div className={`flex flex-col lg:flex-row items-center gap-16 ${reversed ? 'lg:flex-row-reverse' : ''}`}>
                {/* Text Content */}
                <div className="flex-1 space-y-8 fade-in-up">
                    <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 text-primary mb-2">
                        <Icon size={32} />
                    </div>
                    <h2 className="text-4xl lg:text-5xl font-bold text-text-primary dark:text-text-primary-dark tracking-tight leading-tight">
                        {title}
                    </h2>
                    <p className="text-xl text-text-muted dark:text-text-muted-dark leading-relaxed">
                        {description}
                    </p>
                    <ul className="space-y-4">
                        {['Real-time updates', 'Interactive visualization', 'Exportable reports'].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-text-primary dark:text-text-primary-dark font-medium">
                                <CheckCircle2 className="text-primary" size={20} />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Image Visual */}
                <div className="flex-1 w-full perspective-1000 group">
                    <div className="relative transform transition-all duration-700 hover:rotate-y-2 hover:scale-[1.02]">
                        <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-purple-500/20 blur-2xl -z-10 rounded-3xl opacity-0 group-hover:opacity-70 transition-opacity duration-700"></div>
                        <img
                            src={image}
                            alt={title}
                            className="w-full rounded-2xl shadow-2xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const BentoCard = ({ title, description, icon: Icon, image, className = "" }) => (
    <div className={`bg-card dark:bg-card-dark rounded-3xl p-8 border border-border dark:border-border-dark shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden relative flex flex-col ${className}`}>
        <div className="relative z-10 flex-1">
            <div className="inline-flex items-center justify-center p-3 rounded-xl bg-surface dark:bg-surface-dark border border-border dark:border-border-dark text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                <Icon size={24} />
            </div>
            <h3 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark mb-4">{title}</h3>
            <p className="text-text-muted dark:text-text-muted-dark leading-relaxed">{description}</p>
        </div>
        {image && (
            <div className="mt-8 rounded-xl overflow-hidden border border-border dark:border-border-dark relative h-48 lg:h-64 translate-y-4 group-hover:translate-y-2 transition-transform duration-500">
                <img src={image} alt={title} className="w-full h-full object-cover object-top" />
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-card dark:from-card-dark to-transparent"></div>
            </div>
        )}
    </div>
);

export default function LandingPage() {
    const navigate = useNavigate();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && user) {
            navigate('/dashboard');
        }
    }, [user, loading, navigate]);

    if (loading) return null;

    return (
        <div className="min-h-screen bg-surface dark:bg-surface-dark font-sans selection:bg-primary/20 overflow-x-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 w-full bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-md z-50 border-b border-border dark:border-border-dark">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center">
                        <img src="/brand-logo.svg" alt="DollarData" className="h-8 w-auto dark:hidden" />
                        <img src="/brand-logo-dark.svg" alt="DollarData" className="h-8 w-auto hidden dark:block" />
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/login')} className="text-text-muted dark:text-text-muted-dark hover:text-primary font-medium text-sm transition-colors">Sign In</button>
                        <button onClick={() => navigate('/register')} className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40">Get Started</button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10">
                    <div className="absolute top-40 left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50 mix-blend-multiply dark:mix-blend-screen animate-blob"></div>
                    <div className="absolute top-40 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl opacity-50 mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-2000"></div>
                </div>

                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
                    <div className="text-center lg:text-left space-y-8 max-w-2xl mx-auto lg:mx-0">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface dark:bg-surface-dark border border-border dark:border-border-dark shadow-sm text-sm font-semibold animate-fade-in">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            <span className="text-text-secondary dark:text-text-secondary-dark">v2.0 is now live</span>
                        </div>

                        <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-text-primary dark:text-text-primary-dark leading-[1.1]">
                            The Operating System <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
                                for your wealth.
                            </span>
                        </h1>

                        <p className="text-xl text-text-muted dark:text-text-muted-dark leading-relaxed max-w-lg mx-auto lg:mx-0">
                            DollarData isn't just a budget tracker. It's a comprehensive wealth management platform designed for the modern investor.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                            <button
                                onClick={() => navigate('/register')}
                                className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-full font-bold text-lg hover:translate-y-[-2px] transition-all shadow-xl shadow-primary/20"
                            >
                                Start Free Trial
                            </button>
                            <button
                                onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                                className="w-full sm:w-auto px-8 py-4 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark text-text-primary dark:text-text-primary-dark rounded-full font-semibold text-lg hover:border-primary/50 transition-all flex items-center justify-center gap-2"
                            >
                                Exploring Features <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="relative lg:h-[700px] flex items-center justify-center perspective-1000">
                        <div className="relative z-10 transform transition-transform duration-700 hover:scale-[1.01] hover:rotate-y-3">
                            <img
                                src="/landing/landing_hero_dashboard_v3.png"
                                alt="DollarData Dashboard"
                                className="rounded-2xl shadow-2xl border border-border dark:border-border-dark w-full max-w-[800px] bg-surface dark:bg-surface-dark"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Deep Dives (Zig-Zag) */}
            <div id="features" className="bg-surface-secondary dark:bg-surface-secondary-dark/30">
                <FeatureSection
                    title="Visualize Your FLOW"
                    description="Stop guessing where your money goes. our interactive Sankey diagrams trace every dollar from income to expenses, savings, and investments. Identify leaks and optimize your financial engine."
                    image="/landing/landing_sankey_v3.png"
                    icon={Layout}
                />

                <FeatureSection
                    title="Budget Health Score"
                    description="Get a real-time health score for your spending habits. Track adherence, spending pace, and spot potential savings opportunities instantly. Know if you're 'On Track' or 'Over Budget' at a glance."
                    image="/landing/landing_budget_v3.png"
                    icon={PieChart}
                    reversed={true}
                />
            </div>

            {/* Bento Grid Features */}
            <section className="py-24 px-6 bg-surface dark:bg-surface-dark">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl lg:text-4xl font-bold text-text-primary dark:text-text-primary-dark mb-4">Everything you need to grow</h2>
                        <p className="text-text-muted dark:text-text-muted-dark text-lg">Powerful features wrapped in a beautiful interface.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Achievements - Span 2 cols */}
                        <BentoCard
                            title="Gamified Progress"
                            description="Level up your financial health from Wood to Diamond tier. Earn badges for building your Emergency Fund, Net Worth milestones, and Consistency."
                            icon={Award}
                            image="/landing/landing_achievements_v3.png"
                            className="md:col-span-2"
                        />

                        {/* Smart Budget aka Safe-to-Spend */}
                        <BentoCard
                            title="Safe-to-Spend"
                            description="Know exactly how much you can spend today without impacting your savings goals."
                            icon={DollarSign}
                        />

                        {/* Privacy */}
                        <BentoCard
                            title="Bank-Grade Security"
                            description="Your data is encrypted with AES-256. We never sell your data to third parties."
                            icon={Shield}
                        />

                        {/* Bank Sync */}
                        <BentoCard
                            title="Seamless Sync"
                            description="Connect your banks via Basiq for automatic transaction imports and categorization."
                            icon={CheckCircle2}
                            className="md:col-span-2"
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-6 relative overflow-hidden">
                <div className="max-w-5xl mx-auto bg-primary dark:bg-primary-dark rounded-[3rem] p-12 lg:p-20 text-center relative overflow-hidden shadow-2xl shadow-primary/30">
                    <div className="relative z-10 space-y-8">
                        <h2 className="text-4xl lg:text-5xl font-bold text-white tracking-tight">
                            Ready to take control?
                        </h2>
                        <p className="text-white/80 text-xl max-w-xl mx-auto">
                            Join thousands of Australians using DollarData.
                        </p>
                        <button
                            onClick={() => navigate('/register')}
                            className="bg-white text-primary hover:bg-white/90 px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg hover:scale-105"
                        >
                            Open Free Account
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer - Minimal */}
            <footer className="py-12 border-t border-border dark:border-border-dark bg-surface dark:bg-surface-dark">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-8">
                        <img src="/brand-logo.svg" alt="DollarData" className="h-6 w-auto dark:hidden opacity-80" />
                        <img src="/brand-logo-dark.svg" alt="DollarData" className="h-6 w-auto hidden dark:block opacity-80" />
                    </div>
                    <p className="text-text-muted dark:text-text-muted-dark text-sm">
                        &copy; {new Date().getFullYear()} DollarData. Built for financial independence.
                    </p>
                </div>
            </footer>
        </div>
    );
}
