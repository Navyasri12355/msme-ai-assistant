-- Initial database schema
-- This will be expanded in later tasks

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);

-- Business profiles table (basic structure)
-- Note: location and monthly_revenue are TEXT to store encrypted values
CREATE TABLE IF NOT EXISTS business_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(100),
    industry VARCHAR(100),
    location TEXT,
    target_audience TEXT,
    monthly_revenue TEXT,
    employee_count INTEGER DEFAULT 1,
    established_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_business_profiles_user_id ON business_profiles(user_id);

-- Transactions table
-- Note: amount is TEXT to store encrypted values (format: iv:authTag:encryptedData)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    category VARCHAR(100),
    description TEXT NOT NULL,
    date DATE NOT NULL,
    payment_method VARCHAR(100),
    customer_id UUID,
    product_id UUID,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_type ON transactions(type);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_name ON customers(name);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100),
    price TEXT NOT NULL, -- Encrypted
    cost TEXT, -- Encrypted
    category VARCHAR(100),
    stock_quantity INTEGER DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'piece',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_name ON products(name);

-- Add foreign key constraints to transactions table
ALTER TABLE transactions 
ADD CONSTRAINT fk_transactions_customer 
FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

ALTER TABLE transactions 
ADD CONSTRAINT fk_transactions_product 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

-- Conversations table for AI chat history
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_timestamp ON conversations(timestamp);
