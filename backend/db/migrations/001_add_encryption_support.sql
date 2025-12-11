-- Migration to support encrypted data fields
-- Encrypted data is stored as base64 strings in format: iv:authTag:encryptedData

-- Update transactions table: change amount from DECIMAL to TEXT to store encrypted values
ALTER TABLE transactions 
  ALTER COLUMN amount TYPE TEXT;

-- Update business_profiles table: change monthly_revenue from DECIMAL to TEXT
ALTER TABLE business_profiles 
  ALTER COLUMN monthly_revenue TYPE TEXT;

-- Update business_profiles table: increase location size to accommodate encrypted data
ALTER TABLE business_profiles 
  ALTER COLUMN location TYPE TEXT;

-- Note: Existing data will need to be migrated separately if any exists
-- This migration assumes a fresh database or that encryption is being added before production use
