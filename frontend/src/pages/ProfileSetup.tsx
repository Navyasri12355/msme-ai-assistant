import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileApi } from '../api/profile';
import { getErrorMessage, getErrorSuggestion } from '../api/client';
import { BusinessType, Industry } from '../types';

const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
  { value: 'retail', label: 'Retail' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'service', label: 'Service' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'wholesale', label: 'Wholesale' },
  { value: 'e-commerce', label: 'E-commerce' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'other', label: 'Other' },
];

const INDUSTRIES: { value: Industry; label: string }[] = [
  { value: 'food-beverage', label: 'Food & Beverage' },
  { value: 'retail', label: 'Retail' },
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'construction', label: 'Construction' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'textiles', label: 'Textiles' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'professional-services', label: 'Professional Services' },
  { value: 'other', label: 'Other' },
];

export const ProfileSetup: React.FC = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '' as BusinessType,
    industry: '' as Industry,
    location: '',
    targetAudience: '',
    monthlyRevenue: '',
    employeeCount: '',
    establishedDate: '',
  });

  const [error, setError] = useState<string>('');
  const [suggestion, setSuggestion] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Form validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'businessName':
        if (!value.trim()) return 'Business name is required';
        if (value.length > 255) return 'Business name must be less than 255 characters';
        return '';
      case 'businessType':
        if (!value) return 'Business type is required';
        return '';
      case 'industry':
        if (!value) return 'Industry is required';
        return '';
      case 'location':
        if (!value.trim()) return 'Location is required';
        if (value.length > 255) return 'Location must be less than 255 characters';
        return '';
      case 'targetAudience':
        if (!value.trim()) return 'Target audience is required';
        return '';
      case 'employeeCount':
        if (!value) return 'Employee count is required';
        const empCount = parseInt(value);
        if (isNaN(empCount) || empCount < 1) return 'Employee count must be a positive number';
        return '';
      case 'establishedDate':
        if (!value) return 'Established date is required';
        const date = new Date(value);
        if (isNaN(date.getTime())) return 'Invalid date';
        if (date > new Date()) return 'Established date must be in the past';
        return '';
      case 'monthlyRevenue':
        if (value) {
          const revenue = parseFloat(value);
          if (isNaN(revenue) || revenue < 0) return 'Monthly revenue must be a positive number';
        }
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    Object.keys(formData).forEach(key => {
      if (key !== 'monthlyRevenue') { // monthlyRevenue is optional
        const error = validateField(key, formData[key as keyof typeof formData]);
        if (error) newErrors[key] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuggestion('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const profileData = {
        businessName: formData.businessName,
        businessType: formData.businessType,
        industry: formData.industry,
        location: formData.location,
        targetAudience: formData.targetAudience,
        employeeCount: parseInt(formData.employeeCount),
        establishedDate: formData.establishedDate,
        ...(formData.monthlyRevenue && { monthlyRevenue: parseFloat(formData.monthlyRevenue) }),
      };

      await profileApi.create(profileData);
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
      const errorSuggestion = getErrorSuggestion(err);
      if (errorSuggestion) {
        setSuggestion(errorSuggestion);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Set up your business profile
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Tell us about your business to get personalized insights
          </p>
        </div>

        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        {error}
                      </h3>
                      {suggestion && (
                        <div className="mt-2 text-sm text-red-700">
                          {suggestion}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="businessName"
                  id="businessName"
                  required
                  value={formData.businessName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`mt-1 block w-full px-3 py-2 border ${
                    errors.businessName ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                />
                {errors.businessName && (
                  <p className="mt-2 text-sm text-red-600">{errors.businessName}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="businessType" className="block text-sm font-medium text-gray-700">
                    Business Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="businessType"
                    id="businessType"
                    required
                    value={formData.businessType}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`mt-1 block w-full px-3 py-2 border ${
                      errors.businessType ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  >
                    <option value="">Select a type</option>
                    {BUSINESS_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {errors.businessType && (
                    <p className="mt-2 text-sm text-red-600">{errors.businessType}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                    Industry <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="industry"
                    id="industry"
                    required
                    value={formData.industry}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`mt-1 block w-full px-3 py-2 border ${
                      errors.industry ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  >
                    <option value="">Select an industry</option>
                    {INDUSTRIES.map(ind => (
                      <option key={ind.value} value={ind.value}>
                        {ind.label}
                      </option>
                    ))}
                  </select>
                  {errors.industry && (
                    <p className="mt-2 text-sm text-red-600">{errors.industry}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  id="location"
                  required
                  value={formData.location}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g., Mumbai, Maharashtra"
                  className={`mt-1 block w-full px-3 py-2 border ${
                    errors.location ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                />
                {errors.location && (
                  <p className="mt-2 text-sm text-red-600">{errors.location}</p>
                )}
              </div>

              <div>
                <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-700">
                  Target Audience <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="targetAudience"
                  id="targetAudience"
                  required
                  rows={3}
                  value={formData.targetAudience}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Describe your ideal customers"
                  className={`mt-1 block w-full px-3 py-2 border ${
                    errors.targetAudience ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                />
                {errors.targetAudience && (
                  <p className="mt-2 text-sm text-red-600">{errors.targetAudience}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="employeeCount" className="block text-sm font-medium text-gray-700">
                    Number of Employees <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="employeeCount"
                    id="employeeCount"
                    required
                    min="1"
                    value={formData.employeeCount}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`mt-1 block w-full px-3 py-2 border ${
                      errors.employeeCount ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  />
                  {errors.employeeCount && (
                    <p className="mt-2 text-sm text-red-600">{errors.employeeCount}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="monthlyRevenue" className="block text-sm font-medium text-gray-700">
                    Monthly Revenue (₹)
                  </label>
                  <input
                    type="number"
                    name="monthlyRevenue"
                    id="monthlyRevenue"
                    min="0"
                    step="0.01"
                    value={formData.monthlyRevenue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Optional"
                    className={`mt-1 block w-full px-3 py-2 border ${
                      errors.monthlyRevenue ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  />
                  {errors.monthlyRevenue && (
                    <p className="mt-2 text-sm text-red-600">{errors.monthlyRevenue}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="establishedDate" className="block text-sm font-medium text-gray-700">
                  Established Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="establishedDate"
                  id="establishedDate"
                  required
                  max={new Date().toISOString().split('T')[0]}
                  value={formData.establishedDate}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`mt-1 block w-full px-3 py-2 border ${
                    errors.establishedDate ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                />
                {errors.establishedDate && (
                  <p className="mt-2 text-sm text-red-600">{errors.establishedDate}</p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Saving...' : 'Complete Setup'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
