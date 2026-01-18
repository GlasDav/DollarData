/**
 * Tour step definitions for React Joyride
 * 
 * Each tour is an array of step objects with:
 * - target: CSS selector for the element to highlight
 * - content: Text/JSX content for the tooltip
 * - placement: Where to position the tooltip
 * - disableBeacon: Skip the pulsing beacon, show tooltip immediately
 */

export const TOUR_IDS = {
    SETUP: 'setup',
};

export const setupTourSteps = [
    {
        target: '[data-tour="budget-tabs"]',
        content: (
            <div>
                <h3 className="font-bold text-lg mb-2">Welcome to Budget Setup! 🎉</h3>
                <p>Before importing your transactions, let's set up your categories and rules. This will save you hours of manual work later!</p>
            </div>
        ),
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        target: '[data-tour="categories-tab"]',
        content: (
            <div>
                <h3 className="font-bold text-lg mb-2">Step 1: Categories</h3>
                <p>Click the <strong>Categories</strong> tab to see your spending categories. You can customize these to match how you like to organize your money.</p>
            </div>
        ),
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        target: '[data-tour="add-category-btn"]',
        content: (
            <div>
                <h3 className="font-bold text-lg mb-2">Add Custom Categories</h3>
                <p>Use this button to add your own categories. Think about how you want to track spending - maybe "Coffee", "Subscriptions", or "Kids Activities".</p>
            </div>
        ),
        placement: 'right',
        disableBeacon: true,
    },
    {
        target: '[data-tour="rules-tab"]',
        content: (
            <div>
                <h3 className="font-bold text-lg mb-2">Step 2: Smart Rules</h3>
                <p>Now let's set up <strong>Rules</strong>. These automatically categorize your transactions based on keywords - like sorting "WOOLWORTHS" into "Groceries".</p>
            </div>
        ),
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        target: '[data-tour="create-rule-btn"]',
        content: (
            <div>
                <h3 className="font-bold text-lg mb-2">Create Your First Rule</h3>
                <p>Click here to create a rule. Enter keywords that appear in your bank statements (like "NETFLIX" or "UBER") and assign them to a category.</p>
            </div>
        ),
        placement: 'right',
        disableBeacon: true,
    },
    {
        target: '[data-tour="budget-tabs"]',
        content: (
            <div>
                <h3 className="font-bold text-lg mb-2">You're All Set! 🚀</h3>
                <p className="mb-3">Here's your setup checklist:</p>
                <ul className="text-left space-y-2 mb-3">
                    <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Explore your categories</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="text-slate-400">○</span>
                        <span>Customize categories for your needs</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="text-slate-400">○</span>
                        <span>Create rules for auto-categorization</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="text-slate-400">○</span>
                        <span>Import your transactions</span>
                    </li>
                </ul>
                <p className="text-sm text-slate-500">Tip: You can restart this tutorial anytime from Settings → Help</p>
            </div>
        ),
        placement: 'bottom',
        disableBeacon: true,
    },
];

// Map tour IDs to their step arrays
export const tourStepsMap = {
    [TOUR_IDS.SETUP]: setupTourSteps,
};
