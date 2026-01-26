import React, { useState, useMemo } from 'react';
import { Calculator, TrendingDown, Calendar, DollarSign, Info, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * HECS Debt Calculator Component
 * 
 * Calculates repayment schedule based on Australian HECS-HELP thresholds.
 * Uses the 2024-25 ATO repayment rates.
 */

// 2024-25 Australian HECS-HELP Repayment Thresholds
// Source: ATO - https://www.ato.gov.au/Rates/HELP,-TSL-and-SFSS-repayment-thresholds-and-rates/
const REPAYMENT_THRESHOLDS_2024_25 = [
    { min: 0, max: 51550, rate: 0.00 },
    { min: 51550, max: 59518, rate: 0.01 },
    { min: 59518, max: 63089, rate: 0.02 },
    { min: 63089, max: 66875, rate: 0.025 },
    { min: 66875, max: 70888, rate: 0.03 },
    { min: 70888, max: 75140, rate: 0.035 },
    { min: 75140, max: 79649, rate: 0.04 },
    { min: 79649, max: 84429, rate: 0.045 },
    { min: 84429, max: 89494, rate: 0.05 },
    { min: 89494, max: 94865, rate: 0.055 },
    { min: 94865, max: 100557, rate: 0.06 },
    { min: 100557, max: 106590, rate: 0.065 },
    { min: 106590, max: 112985, rate: 0.07 },
    { min: 112985, max: 119764, rate: 0.075 },
    { min: 119764, max: 126950, rate: 0.08 },
    { min: 126950, max: 134568, rate: 0.085 },
    { min: 134568, max: 142642, rate: 0.09 },
    { min: 142642, max: 151200, rate: 0.095 },
    { min: 151200, max: Infinity, rate: 0.10 },
];

// Default indexation rate (CPI-based, 2024 was ~4.7%, 2023 was 7.1%)
const DEFAULT_INDEXATION_RATE = 0.04; // 4% conservative estimate

export default function HECSCalculator({ hecsBalance = 0, onClose }) {
    const [income, setIncome] = useState('');
    const [indexationRate, setIndexationRate] = useState(DEFAULT_INDEXATION_RATE * 100);
    const [showDetails, setShowDetails] = useState(false);

    // Format currency
    const formatCurrency = (val) =>
        new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val);

    // Calculate repayment rate based on income
    const getRepaymentRate = (annualIncome) => {
        for (const bracket of REPAYMENT_THRESHOLDS_2024_25) {
            if (annualIncome >= bracket.min && annualIncome < bracket.max) {
                return bracket.rate;
            }
        }
        return 0.10; // Max rate
    };

    // Calculate annual repayment
    const calculations = useMemo(() => {
        const annualIncome = parseFloat(income) || 0;
        const rate = getRepaymentRate(annualIncome);
        const annualRepayment = annualIncome * rate;
        const indexRate = (parseFloat(indexationRate) || 0) / 100;

        // Calculate payoff schedule
        let balance = hecsBalance;
        let years = 0;
        const schedule = [];
        const maxYears = 30;

        if (annualRepayment > 0) {
            while (balance > 0 && years < maxYears) {
                // Apply indexation at start of financial year (June)
                const indexationAmount = balance * indexRate;
                balance += indexationAmount;

                // Deduct annual repayment
                const payment = Math.min(annualRepayment, balance);
                balance = Math.max(0, balance - payment);
                years++;

                schedule.push({
                    year: years,
                    startBalance: balance + payment - indexationAmount,
                    indexation: indexationAmount,
                    payment,
                    endBalance: balance
                });
            }
        }

        return {
            annualIncome,
            repaymentRate: rate,
            annualRepayment,
            yearsToPayoff: years,
            schedule,
            isAboveThreshold: annualIncome >= REPAYMENT_THRESHOLDS_2024_25[1].min
        };
    }, [income, hecsBalance, indexationRate]);

    const thresholdMin = REPAYMENT_THRESHOLDS_2024_25[1].min;

    return (
        <div className="bg-card dark:bg-card-dark rounded-xl border border-border dark:border-border-dark p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                        <Calculator className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-text-primary dark:text-text-primary-dark">
                            HECS-HELP Calculator
                        </h3>
                        <p className="text-xs text-text-muted dark:text-text-muted-dark">
                            2024-25 ATO Thresholds
                        </p>
                    </div>
                </div>
            </div>

            {/* Current Balance Display */}
            <div className="p-4 bg-surface dark:bg-surface-dark rounded-lg">
                <p className="text-sm text-text-muted dark:text-text-muted-dark mb-1">Current HECS Debt</p>
                <p className="text-2xl font-bold text-text-primary dark:text-text-primary-dark">
                    {formatCurrency(hecsBalance)}
                </p>
            </div>

            {/* Income Input */}
            <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-2">
                    Annual Taxable Income
                </label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">$</span>
                    <input
                        type="number"
                        value={income}
                        onChange={(e) => setIncome(e.target.value)}
                        placeholder="e.g. 75000"
                        className="w-full pl-8 pr-4 py-2.5 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg text-text-primary dark:text-text-primary-dark focus:ring-2 focus:ring-primary outline-none"
                    />
                </div>
                <p className="text-xs text-text-muted dark:text-text-muted-dark mt-1">
                    Repayments start when income exceeds {formatCurrency(thresholdMin)}
                </p>
            </div>

            {/* Indexation Rate */}
            <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-2">
                    Indexation Rate (%)
                    <span className="ml-2 font-normal text-text-muted">CPI-based</span>
                </label>
                <div className="relative">
                    <input
                        type="number"
                        step="0.1"
                        value={indexationRate}
                        onChange={(e) => setIndexationRate(e.target.value)}
                        className="w-full px-4 py-2.5 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg text-text-primary dark:text-text-primary-dark focus:ring-2 focus:ring-primary outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">%</span>
                </div>
            </div>

            {/* Results */}
            {calculations.annualIncome > 0 && (
                <div className="space-y-4">
                    {/* Repayment Summary */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-surface dark:bg-surface-dark rounded-lg">
                            <p className="text-xs text-text-muted dark:text-text-muted-dark mb-1">Repayment Rate</p>
                            <p className="text-xl font-bold text-primary">
                                {(calculations.repaymentRate * 100).toFixed(1)}%
                            </p>
                        </div>
                        <div className="p-4 bg-surface dark:bg-surface-dark rounded-lg">
                            <p className="text-xs text-text-muted dark:text-text-muted-dark mb-1">Annual Repayment</p>
                            <p className="text-xl font-bold text-accent-success">
                                {formatCurrency(calculations.annualRepayment)}
                            </p>
                        </div>
                    </div>

                    {/* Payoff Timeline */}
                    {calculations.isAboveThreshold ? (
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <span className="font-medium text-emerald-700 dark:text-emerald-400">
                                    Estimated Payoff
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                {calculations.yearsToPayoff} years
                            </p>
                            <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80">
                                ~{new Date().getFullYear() + calculations.yearsToPayoff}
                            </p>
                        </div>
                    ) : (
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <div className="flex items-center gap-2">
                                <Info className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                <span className="text-sm text-amber-700 dark:text-amber-400">
                                    Your income is below the repayment threshold.
                                    No mandatory repayments required.
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Detailed Schedule Toggle */}
                    {calculations.schedule.length > 0 && (
                        <div>
                            <button
                                onClick={() => setShowDetails(!showDetails)}
                                className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
                            >
                                {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                {showDetails ? 'Hide' : 'Show'} yearly breakdown
                            </button>

                            {showDetails && (
                                <div className="mt-4 overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border dark:border-border-dark">
                                                <th className="text-left py-2 text-text-muted font-medium">Year</th>
                                                <th className="text-right py-2 text-text-muted font-medium">Indexation</th>
                                                <th className="text-right py-2 text-text-muted font-medium">Payment</th>
                                                <th className="text-right py-2 text-text-muted font-medium">Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {calculations.schedule.slice(0, 10).map((row) => (
                                                <tr key={row.year} className="border-b border-border/50 dark:border-border-dark/50">
                                                    <td className="py-2 text-text-primary dark:text-text-primary-dark">{row.year}</td>
                                                    <td className="py-2 text-right text-amber-600">+{formatCurrency(row.indexation)}</td>
                                                    <td className="py-2 text-right text-accent-success">-{formatCurrency(row.payment)}</td>
                                                    <td className="py-2 text-right font-medium text-text-primary dark:text-text-primary-dark">
                                                        {formatCurrency(row.endBalance)}
                                                    </td>
                                                </tr>
                                            ))}
                                            {calculations.schedule.length > 10 && (
                                                <tr>
                                                    <td colSpan={4} className="py-2 text-center text-text-muted text-xs">
                                                        ... {calculations.schedule.length - 10} more years
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ATO Link */}
            <p className="text-xs text-text-muted dark:text-text-muted-dark">
                Based on{' '}
                <a
                    href="https://www.ato.gov.au/Rates/HELP,-TSL-and-SFSS-repayment-thresholds-and-rates/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                >
                    ATO 2024-25 thresholds
                </a>
            </p>
        </div>
    );
}
