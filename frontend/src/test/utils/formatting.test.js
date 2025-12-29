/**
 * Utility Functions Tests
 * Tests for formatting and validation utilities
 */
import { describe, it, expect } from 'vitest';

// Currency formatting
const formatCurrency = (amount, currency = 'AUD') => {
    return new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency: currency,
    }).format(amount);
};

// Date formatting
const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-AU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

// Number formatting
const formatNumber = (num) => {
    return new Intl.NumberFormat('en-AU').format(num);
};

// Validation
const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

describe('Currency Formatting', () => {
    it('formats positive amounts correctly', () => {
        expect(formatCurrency(1234.56)).toContain('1,234.56');
    });

    it('formats negative amounts correctly', () => {
        expect(formatCurrency(-1234.56)).toContain('1,234.56');
    });

    it('handles zero', () => {
        expect(formatCurrency(0)).toContain('0.00');
    });

    it('rounds to 2 decimal places', () => {
        expect(formatCurrency(123.456)).toContain('123.46');
    });
});

describe('Date Formatting', () => {
    it('formats dates correctly', () => {
        const result = formatDate('2025-01-15');
        expect(result).toContain('15');
        expect(result).toContain('Jan');
        expect(result).toContain('2025');
    });

    it('handles empty dates', () => {
        expect(formatDate('')).toBe('');
        expect(formatDate(null)).toBe('');
    });
});

describe('Number Formatting', () => {
    it('formats large numbers with commas', () => {
        expect(formatNumber(1234567)).toContain('1,234,567');
    });

    it('handles decimal numbers', () => {
        expect(formatNumber(123.45)).toContain('123.45');
    });
});

describe('Email Validation', () => {
    it('validates correct emails', () => {
        expect(isValidEmail('test@example.com')).toBe(true);
        expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('rejects invalid emails', () => {
        expect(isValidEmail('notanemail')).toBe(false);
        expect(isValidEmail('@example.com')).toBe(false);
        expect(isValidEmail('test@')).toBe(false);
        expect(isValidEmail('')).toBe(false);
    });
});
