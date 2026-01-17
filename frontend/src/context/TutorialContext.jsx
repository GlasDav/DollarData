import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const TutorialContext = createContext(null);

const STORAGE_KEY = 'completedTours';

export function TutorialProvider({ children }) {
    const [activeTour, setActiveTour] = useState(null);
    const [stepIndex, setStepIndex] = useState(0);
    const [completedTours, setCompletedTours] = useState(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    // Persist completed tours to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(completedTours));
    }, [completedTours]);

    const startTour = useCallback((tourId) => {
        setActiveTour(tourId);
        setStepIndex(0);
    }, []);

    const completeTour = useCallback((tourId) => {
        setCompletedTours(prev =>
            prev.includes(tourId) ? prev : [...prev, tourId]
        );
        setActiveTour(null);
        setStepIndex(0);
    }, []);

    const closeTour = useCallback(() => {
        setActiveTour(null);
        setStepIndex(0);
    }, []);

    const resetTours = useCallback(() => {
        setCompletedTours([]);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    const isTourCompleted = useCallback((tourId) => {
        return completedTours.includes(tourId);
    }, [completedTours]);

    const value = {
        activeTour,
        stepIndex,
        setStepIndex,
        startTour,
        completeTour,
        closeTour,
        resetTours,
        isTourCompleted,
        isTourActive: activeTour !== null,
    };

    return (
        <TutorialContext.Provider value={value}>
            {children}
        </TutorialContext.Provider>
    );
}

export function useTutorial() {
    const context = useContext(TutorialContext);
    if (!context) {
        throw new Error('useTutorial must be used within a TutorialProvider');
    }
    return context;
}
