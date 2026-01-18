import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, RotateCcw, BookOpen, MessageCircle } from 'lucide-react';
import { useTutorial } from '../../context/TutorialContext';
import { TOUR_IDS } from '../../constants/tourSteps.jsx';

export default function HelpSettings() {
    const navigate = useNavigate();
    const { resetTours, startTour, isTourCompleted } = useTutorial();

    const handleRestartTutorial = () => {
        resetTours();
        navigate('/budget');
        // Start tour after navigation
        setTimeout(() => {
            startTour(TOUR_IDS.SETUP);
        }, 300);
    };

    const setupTourCompleted = isTourCompleted(TOUR_IDS.SETUP);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-text-primary dark:text-text-primary-dark mb-1">Help & Support</h2>
                <p className="text-text-muted text-sm">Get help with DollarData</p>
            </div>

            {/* Tutorial Section */}
            <div className="bg-card dark:bg-card-dark rounded-xl border border-border dark:border-border-dark p-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl">
                        <BookOpen className="text-primary" size={24} />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-text-primary dark:text-text-primary-dark mb-1">
                            Setup Tutorial
                        </h3>
                        <p className="text-sm text-text-muted mb-4">
                            Learn how to set up categories, rules, and import your transactions.
                        </p>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleRestartTutorial}
                                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                <RotateCcw size={16} />
                                {setupTourCompleted ? 'Restart Tutorial' : 'Start Tutorial'}
                            </button>

                            {setupTourCompleted && (
                                <span className="text-xs text-accent-success flex items-center gap-1">
                                    ✓ Completed
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Support Section */}
            <div className="bg-card dark:bg-card-dark rounded-xl border border-border dark:border-border-dark p-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-xl">
                        <MessageCircle className="text-blue-500" size={24} />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-text-primary dark:text-text-primary-dark mb-1">
                            Need Help?
                        </h3>
                        <p className="text-sm text-text-muted">
                            Use the feedback button in the bottom-right corner to report issues or ask questions.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
