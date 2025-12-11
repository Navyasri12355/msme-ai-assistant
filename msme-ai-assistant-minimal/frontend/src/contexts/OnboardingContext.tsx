import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface OnboardingContextType {
  hasCompletedOnboarding: boolean;
  showOnboarding: boolean;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
  resetOnboarding: () => void;
  showHelpCenter: boolean;
  openHelpCenter: () => void;
  closeHelpCenter: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

interface OnboardingProviderProps {
  children: ReactNode;
}

const ONBOARDING_STORAGE_KEY = 'msme_onboarding_completed';

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [showHelpCenter, setShowHelpCenter] = useState<boolean>(false);

  useEffect(() => {
    // Check if user has completed onboarding
    const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
    setHasCompletedOnboarding(completed);
    
    // Show onboarding for new users
    if (!completed) {
      // Small delay to let the app render first
      setTimeout(() => {
        setShowOnboarding(true);
      }, 500);
    }
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setHasCompletedOnboarding(true);
    setShowOnboarding(false);
  };

  const skipOnboarding = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setHasCompletedOnboarding(true);
    setShowOnboarding(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    setHasCompletedOnboarding(false);
    setShowOnboarding(true);
  };

  const openHelpCenter = () => {
    setShowHelpCenter(true);
  };

  const closeHelpCenter = () => {
    setShowHelpCenter(false);
  };

  const value: OnboardingContextType = {
    hasCompletedOnboarding,
    showOnboarding,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
    showHelpCenter,
    openHelpCenter,
    closeHelpCenter,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};
