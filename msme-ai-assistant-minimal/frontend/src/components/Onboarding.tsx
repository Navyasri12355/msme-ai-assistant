import React, { useState } from 'react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  features: string[];
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to MSME AI Assistant',
    description: 'Your personal business advisor that helps you grow your business with smart insights and recommendations.',
    icon: '👋',
    features: [
      'Get instant answers to your business questions',
      'Track your income and expenses automatically',
      'Receive personalized marketing advice',
      'See predictions for your future cash flow'
    ]
  },
  {
    id: 'dashboard',
    title: 'Your Business Dashboard',
    description: 'See all your important business numbers in one place. Track daily revenue, customer count, and top products.',
    icon: '📊',
    features: [
      'View key metrics at a glance',
      'Get alerts when something needs attention',
      'See trends compared to previous periods',
      'Receive actionable insights to improve your business'
    ]
  },
  {
    id: 'transactions',
    title: 'Track Your Money',
    description: 'Upload your income and expenses to understand your financial health. We automatically categorize everything for you.',
    icon: '💰',
    features: [
      'Add transactions one by one or in bulk',
      'Automatic categorization of income and expenses',
      'See where your money is going',
      'Get warnings about unusual transactions'
    ]
  },
  {
    id: 'finance',
    title: 'Financial Insights',
    description: 'Understand your finances better with charts and predictions. Plan ahead with cash flow forecasts.',
    icon: '📈',
    features: [
      'Visual charts of income vs expenses',
      '3-month cash flow predictions',
      'Identify seasonal patterns in your business',
      'Get recommendations to cut costs'
    ]
  },
  {
    id: 'marketing',
    title: 'Marketing Made Easy',
    description: 'Get customized marketing strategies and content ideas without hiring expensive consultants.',
    icon: '📢',
    features: [
      'Low-cost marketing strategies for your business',
      'Content ideas for social media and promotions',
      'Understand customer sentiment from feedback',
      'Step-by-step action plans'
    ]
  },
  {
    id: 'chat',
    title: 'AI Business Advisor',
    description: 'Ask questions in plain language and get instant advice based on your actual business data.',
    icon: '💬',
    features: [
      'Ask anything about your business',
      'Get personalized recommendations',
      'Receive data-driven insights',
      'Available 24/7 to help you'
    ]
  }
];

interface OnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  const step = onboardingSteps[currentStep];
  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Getting Started</h2>
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium"
            >
              Skip Tour
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Step {currentStep + 1} of {onboardingSteps.length}
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">{step.icon}</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">{step.title}</h3>
            <p className="text-gray-600 text-lg">{step.description}</p>
          </div>

          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">What you can do:</h4>
            <ul className="space-y-2">
              {step.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <svg
                    className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Tip */}
          {currentStep === 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-2xl">💡</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Quick Tip:</strong> This tour takes less than 2 minutes. You can always access help by clicking the "?" icon in the top menu.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex space-x-2">
              {onboardingSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full ${
                    index === currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              {currentStep === onboardingSteps.length - 1 ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
