import React, { useState, useEffect } from 'react';
import { profileApi } from '../api/profile';
import { userApi, UserProfile, UserStats } from '../api/user';
import { getErrorMessage } from '../api/client';
import { Navigation } from '../components/Navigation';
import { BusinessProfile, Industry, BusinessType, CreateBusinessProfileData } from '../types';

export const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'personal' | 'business' | 'security'>('personal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Personal Info State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  
  // Business Profile State
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>({
    id: '',
    userId: '',
    businessName: '',
    industry: 'other' as Industry,
    businessType: 'other' as BusinessType,
    location: '',
    targetAudience: '',
    employeeCount: 1,
    monthlyRevenue: 0,
    establishedDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  // Security State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load user profile
      const profile = await userApi.getProfile();
      setUserProfile(profile);

      // Load user statistics
      const stats = await userApi.getStats();
      setUserStats(stats);

      // Load business profile (handle 404 if profile doesn't exist)
      try {
        const businessProfileData = await profileApi.get();
        if (businessProfileData) {
          // Ensure establishedDate is a proper Date object
          const profileWithDate = {
            ...businessProfileData,
            establishedDate: new Date(businessProfileData.establishedDate),
            createdAt: new Date(businessProfileData.createdAt),
            updatedAt: new Date(businessProfileData.updatedAt),
          };
          setBusinessProfile(profileWithDate);
        }
      } catch (profileErr: any) {
        // If profile doesn't exist (404), that's okay - user can create one
        if (profileErr.response?.status !== 404) {
          throw profileErr; // Re-throw if it's not a 404
        }
        // For 404, keep the default empty business profile state
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      const profileData = {
        businessName: businessProfile.businessName,
        businessType: businessProfile.businessType,
        industry: businessProfile.industry,
        location: businessProfile.location,
        targetAudience: businessProfile.targetAudience,
        employeeCount: businessProfile.employeeCount,
        monthlyRevenue: businessProfile.monthlyRevenue,
        establishedDate: businessProfile.establishedDate instanceof Date 
          ? businessProfile.establishedDate.toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
      };

      let updatedProfile;
      if (businessProfile.id) {
        // Update existing profile
        updatedProfile = await profileApi.update(profileData);
      } else {
        // Create new profile - cast to CreateBusinessProfileData
        updatedProfile = await profileApi.create(profileData as CreateBusinessProfileData);
      }
      
      setBusinessProfile(updatedProfile);
      setSuccessMessage('Business profile saved successfully!');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      await userApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      setSuccessMessage('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const TabButton: React.FC<{ 
    tab: 'personal' | 'business' | 'security'; 
    label: string; 
    icon: React.ReactNode 
  }> = ({ tab, label, icon }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        activeTab === tab
          ? 'bg-blue-100 text-blue-700 border border-blue-200'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      {icon}
      <span className="ml-2">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="mt-2 text-gray-600">Manage your account and business information</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            <p>{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            <p className="font-semibold">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex space-x-4">
              <TabButton
                tab="personal"
                label="Personal Info"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              />
              <TabButton
                tab="business"
                label="Business Profile"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                }
              />
              <TabButton
                tab="security"
                label="Security"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
              />
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Personal Info Tab */}
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
                  
                  {userProfile && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address
                        </label>
                        <p className="text-gray-900 font-medium">{userProfile.email}</p>
                        <p className="text-xs text-gray-500 mt-1">This is your login email</p>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Member Since
                        </label>
                        <p className="text-gray-900 font-medium">{formatDate(userProfile.createdAt)}</p>
                        <p className="text-xs text-gray-500 mt-1">Account creation date</p>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Updated
                        </label>
                        <p className="text-gray-900 font-medium">{formatDate(userProfile.updatedAt)}</p>
                        <p className="text-xs text-gray-500 mt-1">Profile last modified</p>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Account Status
                        </label>
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          <p className="text-gray-900 font-medium">Active</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Your account is in good standing</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Account Statistics</h3>
                  {userStats ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-600">{userStats.transactionCount.toLocaleString()}</div>
                        <div className="text-sm text-blue-700">Transactions</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600">{userStats.conversationCount.toLocaleString()}</div>
                        <div className="text-sm text-green-700">AI Conversations</div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-purple-600">{userStats.insightsCount.toLocaleString()}</div>
                        <div className="text-sm text-purple-700">Business Insights</div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-100 p-4 rounded-lg text-center animate-pulse">
                        <div className="h-8 bg-gray-300 rounded mb-2"></div>
                        <div className="h-4 bg-gray-300 rounded"></div>
                      </div>
                      <div className="bg-gray-100 p-4 rounded-lg text-center animate-pulse">
                        <div className="h-8 bg-gray-300 rounded mb-2"></div>
                        <div className="h-4 bg-gray-300 rounded"></div>
                      </div>
                      <div className="bg-gray-100 p-4 rounded-lg text-center animate-pulse">
                        <div className="h-8 bg-gray-300 rounded mb-2"></div>
                        <div className="h-4 bg-gray-300 rounded"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Business Profile Tab */}
            {activeTab === 'business' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Profile</h2>
                <p className="text-gray-600 mb-6">
                  This information helps our AI provide personalized business advice and insights.
                </p>

                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Loading business profile...</span>
                  </div>
                ) : (
                  <form onSubmit={handleBusinessProfileUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Business Name *
                        </label>
                        <input
                          type="text"
                          value={businessProfile.businessName}
                          onChange={(e) => setBusinessProfile({ ...businessProfile, businessName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your business name"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Industry *
                        </label>
                        <select
                          value={businessProfile.industry}
                          onChange={(e) => setBusinessProfile({ ...businessProfile, industry: e.target.value as Industry })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">Select industry</option>
                          <option value="retail">Retail</option>
                          <option value="food-beverage">Food & Beverage</option>
                          <option value="technology">Technology</option>
                          <option value="healthcare">Healthcare</option>
                          <option value="education">Education</option>
                          <option value="construction">Construction</option>
                          <option value="agriculture">Agriculture</option>
                          <option value="textiles">Textiles</option>
                          <option value="automotive">Automotive</option>
                          <option value="hospitality">Hospitality</option>
                          <option value="professional-services">Professional Services</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Business Type *
                        </label>
                        <select
                          value={businessProfile.businessType}
                          onChange={(e) => setBusinessProfile({ ...businessProfile, businessType: e.target.value as BusinessType })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">Select business type</option>
                          <option value="retail">Retail</option>
                          <option value="restaurant">Restaurant</option>
                          <option value="service">Service</option>
                          <option value="manufacturing">Manufacturing</option>
                          <option value="wholesale">Wholesale</option>
                          <option value="e-commerce">E-commerce</option>
                          <option value="consulting">Consulting</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Location *
                        </label>
                        <input
                          type="text"
                          value={businessProfile.location}
                          onChange={(e) => setBusinessProfile({ ...businessProfile, location: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="City, State"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Target Audience
                        </label>
                        <input
                          type="text"
                          value={businessProfile.targetAudience}
                          onChange={(e) => setBusinessProfile({ ...businessProfile, targetAudience: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., Young professionals, Families"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Employee Count
                        </label>
                        <select
                          value={businessProfile.employeeCount}
                          onChange={(e) => setBusinessProfile({ ...businessProfile, employeeCount: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value={1}>1 (Just me)</option>
                          <option value={2}>2-5 employees</option>
                          <option value={6}>6-10 employees</option>
                          <option value={11}>11-25 employees</option>
                          <option value={26}>26-50 employees</option>
                          <option value={51}>50+ employees</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Monthly Revenue (₹)
                        </label>
                        <input
                          type="number"
                          value={businessProfile.monthlyRevenue || ''}
                          onChange={(e) => setBusinessProfile({ ...businessProfile, monthlyRevenue: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Approximate monthly revenue"
                          min="0"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Established Date
                        </label>
                        <input
                          type="date"
                          value={businessProfile.establishedDate instanceof Date 
                            ? businessProfile.establishedDate.toISOString().split('T')[0]
                            : new Date().toISOString().split('T')[0]
                          }
                          onChange={(e) => setBusinessProfile({ ...businessProfile, establishedDate: new Date(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Saving...' : 'Save Business Profile'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Security Settings</h2>
                  
                  {/* Change Password */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                    
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Current Password
                        </label>
                        <input
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          minLength={6}
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters long</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Changing...' : 'Change Password'}
                      </button>
                    </form>
                  </div>

                  {/* Account Security Info */}
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-blue-900 mb-4">Account Security</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-blue-800">Password protected account</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-blue-800">Secure data encryption</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-blue-800">Regular security updates</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};