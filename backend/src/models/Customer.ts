import { Pool } from 'pg';

export interface Customer {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

export interface CreateCustomerData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  status?: 'active' | 'inactive';
}

export interface UpdateCustomerData extends Partial<CreateCustomerData> {}

export class CustomerModel {
  constructor(private db: Pool) {}

  async create(userId: string, data: CreateCustomerData): Promise<Customer> {
    const query = `
      INSERT INTO customers (user_id, name, email, phone, address, notes, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [
      userId,
      data.name,
      data.email || null,
      data.phone || null,
      data.address || null,
      data.notes || null,
      data.status || 'active'
    ];

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async findByUserId(userId: string, options?: {
    status?: 'active' | 'inactive';
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Customer[]> {
    let query = 'SELECT * FROM customers WHERE user_id = $1';
    const values: any[] = [userId];
    let paramCount = 1;

    if (options?.status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      values.push(options.status);
    }

    if (options?.search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
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
    return result.rows;
  }

  async findById(id: string, userId: string): Promise<Customer | null> {
    const query = 'SELECT * FROM customers WHERE id = $1 AND user_id = $2';
    const result = await this.db.query(query, [id, userId]);
    return result.rows[0] || null;
  }

  async update(id: string, userId: string, data: UpdateCustomerData): Promise<Customer | null> {
    const fields = [];
    const values = [];
    let paramCount = 0;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        paramCount++;
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
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
      UPDATE customers 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount - 1} AND user_id = $${paramCount}
      RETURNING *
    `;

    const result = await this.db.query(query, values);
    return result.rows[0] || null;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const query = 'DELETE FROM customers WHERE id = $1 AND user_id = $2';
    const result = await this.db.query(query, [id, userId]);
    return (result.rowCount || 0) > 0;
  }

  async getStats(userId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'inactive') as inactive
      FROM customers 
      WHERE user_id = $1
    `;
    
    const result = await this.db.query(query, [userId]);
    const row = result.rows[0];
    
    return {
      total: parseInt(row.total),
      active: parseInt(row.active),
      inactive: parseInt(row.inactive)
    };
  }
}