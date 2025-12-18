import React, { useState, useEffect } from 'react';
import { transactionApi, Transaction, CreateTransactionData, TransactionFilters } from '../api/transaction';
import { getErrorMessage, getErrorSuggestion } from '../api/client';
import { Navigation } from '../components/Navigation';

export const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorSuggestion, setErrorSuggestion] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Form state for single transaction
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<CreateTransactionData>({
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
    category: '',
    paymentMethod: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Batch upload state
  const [showBatchUpload, setShowBatchUpload] = useState(false);
  const [batchText, setBatchText] = useState('');
  const [batchErrors, setBatchErrors] = useState<string[]>([]);
  const [uploadMethod, setUploadMethod] = useState<'text' | 'file'>('text');

  // Filter state
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  // Load transactions on mount and when filters change
  useEffect(() => {
    loadTransactions();
  }, [filters]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await transactionApi.getTransactions(filters);
      setTransactions(data);
    } catch (err) {
      setError(getErrorMessage(err));
      setErrorSuggestion(getErrorSuggestion(err) || null);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.description || formData.description.trim() === '') {
      errors.description = 'Description is required';
    }

    if (formData.amount === 0) {
      errors.amount = 'Amount must be greater than 0';
    }

    if (!formData.date) {
      errors.date = 'Date is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      
      await transactionApi.createTransaction(formData);
      
      setSuccessMessage('Transaction added successfully!');
      setShowAddForm(false);
      setFormData({
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0],
        type: 'expense',
        category: '',
        paymentMethod: '',
      });
      setFormErrors({});
      
      // Reload transactions
      await loadTransactions();
    } catch (err) {
      setError(getErrorMessage(err));
      setErrorSuggestion(getErrorSuggestion(err) || null);
    } finally {
      setLoading(false);
    }
  };

  const parseCSVData = (csvText: string): { transactions: CreateTransactionData[], errors: string[] } => {
    const lines = csvText.trim().split('\n');
    const transactions: CreateTransactionData[] = [];
    const errors: string[] = [];

    lines.forEach((line, index) => {
      // Skip empty lines
      if (!line.trim()) return;
      
      const parts = line.split(',').map(p => p.trim());
      
      if (parts.length < 3) {
        errors.push(`Line ${index + 1}: Invalid format. Expected: date,amount,description[,type,category]`);
        return;
      }

      const [date, amountStr, description, type, category] = parts;
      const amount = parseFloat(amountStr);

      if (isNaN(amount) || amount === 0) {
        errors.push(`Line ${index + 1}: Invalid amount "${amountStr}"`);
        return;
      }

      if (!description || description.trim() === '') {
        errors.push(`Line ${index + 1}: Description is required`);
        return;
      }

      if (!date) {
        errors.push(`Line ${index + 1}: Date is required`);
        return;
      }

      // Validate date format
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        errors.push(`Line ${index + 1}: Invalid date format "${date}". Use YYYY-MM-DD format`);
        return;
      }

      transactions.push({
        date,
        amount,
        description,
        type: (type as 'income' | 'expense') || 'expense',
        category: category || undefined,
      });
    });

    return { transactions, errors };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      setBatchText(csvText);
    };
    reader.onerror = () => {
      setError('Error reading file. Please try again.');
    };
    reader.readAsText(file);
  };

  const handleBatchUpload = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      setBatchErrors([]);

      if (!batchText.trim()) {
        setError('Please enter CSV data or upload a file');
        return;
      }

      const { transactions, errors } = parseCSVData(batchText);

      if (errors.length > 0) {
        setBatchErrors(errors);
        return;
      }

      if (transactions.length === 0) {
        setError('No valid transactions to upload');
        return;
      }

      await transactionApi.createTransactionsBatch(transactions);
      
      setSuccessMessage(`Successfully uploaded ${transactions.length} transaction(s)!`);
      setShowBatchUpload(false);
      setBatchText('');
      setUploadMethod('text');
      
      // Reload transactions
      await loadTransactions();
    } catch (err) {
      setError(getErrorMessage(err));
      setErrorSuggestion(getErrorSuggestion(err) || null);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      
      await transactionApi.deleteTransaction(id);
      
      setSuccessMessage('Transaction deleted successfully!');
      await loadTransactions();
    } catch (err) {
      setError(getErrorMessage(err));
      setErrorSuggestion(getErrorSuggestion(err) || null);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    // Filters are already in state, just trigger reload
    loadTransactions();
  };

  const clearFilters = () => {
    setFilters({});
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Transaction Management</h1>
          <p className="mt-2 text-gray-600">Track and manage your business transactions</p>
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
            {errorSuggestion && (
              <p className="mt-1 text-sm">{errorSuggestion}</p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap gap-4">
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setShowBatchUpload(false);
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showAddForm ? 'Cancel' : 'Add Transaction'}
          </button>
          
          <button
            onClick={() => {
              setShowBatchUpload(!showBatchUpload);
              setShowAddForm(false);
            }}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            {showBatchUpload ? 'Cancel' : 'Batch Upload'}
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>

          <button
            onClick={loadTransactions}
            disabled={loading}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        {/* Add Transaction Form */}
        {showAddForm && (
          <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Add New Transaction</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.amount ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.amount && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.amount}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.date && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Sales, Rent, Utilities"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <input
                    type="text"
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    placeholder="e.g., Cash, Card, UPI"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter transaction description"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.description ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.description && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Transaction'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Batch Upload Form */}
        {showBatchUpload && (
          <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Batch Upload Transactions</h2>
            <p className="text-sm text-gray-600 mb-4">
              Upload transactions in CSV format: date,amount,description,type,category
              <br />
              Example: 2024-01-15,1500,Product Sale,income,sales
            </p>

            {/* Upload Method Selection */}
            <div className="mb-4">
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="uploadMethod"
                    value="text"
                    checked={uploadMethod === 'text'}
                    onChange={(e) => setUploadMethod(e.target.value as 'text' | 'file')}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">Enter CSV Text</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="uploadMethod"
                    value="file"
                    checked={uploadMethod === 'file'}
                    onChange={(e) => setUploadMethod(e.target.value as 'text' | 'file')}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">Upload CSV File</span>
                </label>
              </div>
            </div>

            {/* File Upload */}
            {uploadMethod === 'file' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select CSV File
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                      </svg>
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">CSV files only (MAX. 5MB)</p>
                    </div>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Text Area */}
            {uploadMethod === 'text' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CSV Data
                </label>
                <textarea
                  value={batchText}
                  onChange={(e) => setBatchText(e.target.value)}
                  placeholder="2024-01-15,1500,Product Sale,income,sales&#10;2024-01-16,500,Office Rent,expense,rent"
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
              </div>
            )}

            {/* Preview of uploaded data */}
            {batchText && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview ({batchText.split('\n').filter(line => line.trim()).length} rows)
                </label>
                <div className="bg-gray-50 p-3 rounded-lg max-h-32 overflow-y-auto">
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                    {batchText.split('\n').slice(0, 5).join('\n')}
                    {batchText.split('\n').length > 5 && '\n... and more'}
                  </pre>
                </div>
              </div>
            )}

            {/* CSV Format Help */}
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">CSV Format Requirements:</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• <strong>Date:</strong> YYYY-MM-DD format (e.g., 2024-01-15)</li>
                <li>• <strong>Amount:</strong> Positive number (e.g., 1500.50)</li>
                <li>• <strong>Description:</strong> Transaction description (required)</li>
                <li>• <strong>Type:</strong> "income" or "expense" (optional, defaults to expense)</li>
                <li>• <strong>Category:</strong> Category name (optional)</li>
              </ul>
              <p className="text-xs text-blue-600 mt-2">
                <strong>Example:</strong> 2024-01-15,1500,Product Sale,income,sales
              </p>
            </div>

            {batchErrors.length > 0 && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                <p className="font-semibold mb-2">Validation Errors:</p>
                <ul className="list-disc list-inside space-y-1">
                  {batchErrors.map((err, idx) => (
                    <li key={idx} className="text-sm">{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleBatchUpload}
                disabled={loading || !batchText.trim()}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Uploading...' : 'Upload Transactions'}
              </button>
              <button
                onClick={() => {
                  setShowBatchUpload(false);
                  setBatchText('');
                  setUploadMethod('text');
                  setBatchErrors([]);
                }}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Filter Transactions</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={filters.type || ''}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value as 'income' | 'expense' | undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={filters.category || ''}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  placeholder="Filter by category"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-4 flex gap-4">
              <button
                onClick={applyFilters}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
              <button
                onClick={clearFilters}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Transactions List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Transactions</h2>
            <p className="text-sm text-gray-600 mt-1">
              {transactions.length} transaction(s) found
            </p>
          </div>

          {loading && transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Loading transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No transactions found. Add your first transaction to get started!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {transaction.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                          {transaction.category || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.type === 'income'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {transaction.type}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
