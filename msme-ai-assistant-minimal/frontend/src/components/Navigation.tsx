import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import { Tooltip } from './Tooltip';

export const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const { openHelpCenter, resetOnboarding } = useOnboarding();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navLinkClass = (path: string) => {
    return isActive(path)
      ? 'text-blue-600 hover:text-blue-700 px-3 py-2 rounded-md text-sm font-medium border-b-2 border-blue-600'
      : 'text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium';
  };

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold text-gray-900">MSME AI Assistant</h1>
            <div className="flex space-x-4">
              <Tooltip content="See your business overview and key metrics">
                <button
                  onClick={() => navigate('/dashboard')}
                  className={navLinkClass('/dashboard')}
                >
                  Dashboard
                </button>
              </Tooltip>

              <Tooltip content="Add and view your income and expenses">
                <button
                  onClick={() => navigate('/transactions')}
                  className={navLinkClass('/transactions')}
                >
                  Transactions
                </button>
              </Tooltip>

              <Tooltip content="View financial analysis and cash flow forecasts">
                <button
                  onClick={() => navigate('/finance')}
                  className={navLinkClass('/finance')}
                >
                  Finance
                </button>
              </Tooltip>

              <Tooltip content="Get marketing strategies and content ideas">
                <button
                  onClick={() => navigate('/marketing')}
                  className={navLinkClass('/marketing')}
                >
                  Marketing
                </button>
              </Tooltip>

              <Tooltip content="Ask questions and get AI-powered business advice">
                <button
                  onClick={() => navigate('/chat')}
                  className={navLinkClass('/chat')}
                >
                  AI Chat
                </button>
              </Tooltip>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Tooltip content="Search help articles and guides">
              <button
                onClick={openHelpCenter}
                className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
                aria-label="Open help center"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
            </Tooltip>

            <Tooltip content="Restart the guided tour">
              <button
                onClick={resetOnboarding}
                className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
                aria-label="Restart tour"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </button>
            </Tooltip>

            <span className="text-sm text-gray-700">{user?.email}</span>
            
            <Tooltip content="Sign out of your account">
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Logout
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </nav>
  );
};
