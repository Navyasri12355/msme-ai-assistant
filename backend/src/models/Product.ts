import { Pool } from 'pg';
import { encrypt, decrypt } from '../utils/encryption';

export interface Product {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  sku?: string;
  price: string; // Encrypted
  cost?: string; // Encrypted
  category?: string;
  stock_quantity: number;
  unit: string;
  status: 'active' | 'inactive' | 'discontinued';
  created_at: Date;
  updated_at: Date;
}

export interface ProductWithDecryptedPrices extends Omit<Product, 'price' | 'cost'> {
  price: number;
  cost?: number;
}

export interface CreateProductData {
  name: string;
  description?: string;
  sku?: string;
  price: number;
  cost?: number;
  category?: string;
  stock_quantity?: number;
  unit?: string;
  status?: 'active' | 'inactive' | 'discontinued';
}

export interface UpdateProductData extends Partial<CreateProductData> {}

export class ProductModel {
  constructor(private db: Pool) {}

  async create(userId: string, data: CreateProductData): Promise<ProductWithDecryptedPrices> {
    const encryptedPrice = encrypt(data.price.toString());
    const encryptedCost = data.cost ? encrypt(data.cost.toString()) : null;
    
    const query = `
      INSERT INTO products (user_id, name, description, sku, price, cost, category, stock_quantity, unit, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [
      userId,
      data.name,
      data.description || null,
      data.sku || null,
      encryptedPrice,
      encryptedCost,
      data.category || null,
      data.stock_quantity || 0,
      data.unit || 'piece',
      data.status || 'active'
    ];

    const result = await this.db.query(query, values);
    const product = result.rows[0];
    
    return this.decryptProduct(product);
  }

  async findByUserId(userId: string, options?: {
    status?: 'active' | 'inactive' | 'discontinued';
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<ProductWithDecryptedPrices[]> {
    let query = 'SELECT * FROM products WHERE user_id = $1';
    const values: any[] = [userId];
    let paramCount = 1;

    if (options?.status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      values.push(options.status);
    }

    if (options?.category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      values.push(options.category);
    }

    if (options?.search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount} OR sku ILIKE $${paramCount})`;
      values.push(`%${options.search}%`);
    }

    query += ' ORDER BY created_at DESC';

    if (options?.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      values.push(options.limit);
    }

    if (options?.offset) {
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      values.push(options.offset);
    }

    const result = await this.db.query(query, values);
    return result.rows.map(product => this.decryptProduct(product));
  }

  async findById(id: string, userId: string): Promise<ProductWithDecryptedPrices | null> {
    const query = 'SELECT * FROM products WHERE id = $1 AND user_id = $2';
    const result = await this.db.query(query, [id, userId]);
    
    if (!result.rows[0]) {
      return null;
    }
    
    return this.decryptProduct(result.rows[0]);
  }

  async update(id: string, userId: string, data: UpdateProductData): Promise<ProductWithDecryptedPrices | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        paramCount++;
        if (key === 'price') {
          fields.push(`${key} = $${paramCount}`);
          values.push(encrypt(value?.toString() || '0'));
        } else if (key === 'cost') {
          fields.push(`${key} = $${paramCount}`);
          values.push(value !== null && value !== undefined && typeof value === 'number' ? encrypt(value.toString()) : null);
        } else {
          fields.push(`${key} = $${paramCount}`);
          values.push(value);
        }
      }
    });

    if (fields.length === 0) {
      return this.findById(id, userId);
    }

    paramCount++;
    fields.push(`updated_at = $${paramCount}`);
    values.push(new Date());

    paramCount++;
    values.push(id);
    paramCount++;
    values.push(userId);

    const query = `
      UPDATE products 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount - 1} AND user_id = $${paramCount}
      RETURNING *
    `;

    const result = await this.db.query(query, values);
    
    if (!result.rows[0]) {
      return null;
    }
    
    return this.decryptProduct(result.rows[0]);
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const query = 'DELETE FROM products WHERE id = $1 AND user_id = $2';
    const result = await this.db.query(query, [id, userId]);
    return (result.rowCount || 0) > 0;
  }

  async getStats(userId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    discontinued: number;
    lowStock: number;
    categories: { category: string; count: number }[];
  }> {
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'inactive') as inactive,
        COUNT(*) FILTER (WHERE status = 'discontinued') as discontinued,
        COUNT(*) FILTER (WHERE stock_quantity <= 5) as low_stock
      FROM products 
      WHERE user_id = $1
    `;
    
    const categoriesQuery = `
      SELECT category, COUNT(*) as count
      FROM products 
      WHERE user_id = $1 AND category IS NOT NULL
      GROUP BY category
      ORDER BY count DESC
      LIMIT 10
    `;
    
    const [statsResult, categoriesResult] = await Promise.all([
      this.db.query(statsQuery, [userId]),
      this.db.query(categoriesQuery, [userId])
    ]);
    
    const stats = statsResult.rows[0];
    
    return {
      total: parseInt(stats.total),
      active: parseInt(stats.active),
      inactive: parseInt(stats.inactive),
      discontinued: parseInt(stats.discontinued),
      lowStock: parseInt(stats.low_stock),
      categories: categoriesResult.rows.map(row => ({
        category: row.category,
        count: parseInt(row.count)
      }))
    };
  }

  async getCategories(userId: string): Promise<string[]> {
    const query = `
      SELECT DISTINCT category
      FROM products 
      WHERE user_id = $1 AND category IS NOT NULL
      ORDER BY category
    `;
    
    const result = await this.db.query(query, [userId]);
    return result.rows.map(row => row.category);
  }

  private decryptProduct(product: Product): ProductWithDecryptedPrices {
    return {
      ...product,
      price: parseFloat(decrypt(product.price)),
      cost: product.cost ? parseFloat(decrypt(product.cost)) : undefined
    };
  }
}