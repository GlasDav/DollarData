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
        target: '[data-tour="nav-data-management"]',
        content: (
            <div>
                <h3 className="font-bold text-lg mb-2">You're Ready to Import! 🚀</h3>
                <p>Great job! Now head to <strong>Settings</strong> → <strong>Data Management</strong> to import your transactions. Your rules will automatically categorize them!</p>
            </div>
        ),
        placement: 'right',
        disableBeacon: true,
    },
];

// Map tour IDs to their step arrays
export const tourStepsMap = {
    [TOUR_IDS.SETUP]: setupTourSteps,
};
