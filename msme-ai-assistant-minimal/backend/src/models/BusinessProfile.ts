import { pool } from '../config/database';
import { BusinessProfile } from '../types';
import { encrypt, decrypt, encryptNumber, decryptNumber } from '../utils/encryption';

export interface CreateBusinessProfileData {
  userId: string;
  businessName: string;
  businessType: string;
  industry: string;
  location: string;
  targetAudience: string;
  monthlyRevenue?: number;
  employeeCount: number;
  establishedDate: Date;
}

export interface UpdateBusinessProfileData {
  businessName?: string;
  businessType?: string;
  industry?: string;
  location?: string;
  targetAudience?: string;
  monthlyRevenue?: number;
  employeeCount?: number;
  establishedDate?: Date;
}

export class BusinessProfileModel {
  /**
   * Create a new business profile
   */
  static async create(data: CreateBusinessProfileData): Promise<BusinessProfile> {
    // Encrypt sensitive data
    const encryptedLocation = encrypt(data.location);
    const encryptedRevenue = data.monthlyRevenue ? encryptNumber(data.monthlyRevenue) : null;
    
    const result = await pool.query(
      `INSERT INTO business_profiles (
        user_id, business_name, business_type, industry, location,
        target_audience, monthly_revenue, employee_count, established_date,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *`,
      [
        data.userId,
        data.businessName,
        data.businessType,
        data.industry,
        encryptedLocation,
        data.targetAudience,
        encryptedRevenue,
        data.employeeCount,
        data.establishedDate,
      ]
    );

    return this.mapRowToBusinessProfile(result.rows[0]);
  }

  /**
   * Find business profile by user ID
   */
  static async findByUserId(userId: string): Promise<BusinessProfile | null> {
    const result = await pool.query(
      'SELECT * FROM business_profiles WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToBusinessProfile(result.rows[0]);
  }

  /**
   * Find business profile by ID
   */
  static async findById(id: string): Promise<BusinessProfile | null> {
    const result = await pool.query(
      'SELECT * FROM business_profiles WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToBusinessProfile(result.rows[0]);
  }

  /**
   * Update business profile
   */
  static async update(
    userId: string,
    data: UpdateBusinessProfileData
  ): Promise<BusinessProfile> {
    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.businessName !== undefined) {
      updates.push(`business_name = $${paramCount++}`);
      values.push(data.businessName);
    }
    if (data.businessType !== undefined) {
      updates.push(`business_type = $${paramCount++}`);
      values.push(data.businessType);
    }
    if (data.industry !== undefined) {
      updates.push(`industry = $${paramCount++}`);
      values.push(data.industry);
    }
    if (data.location !== undefined) {
      updates.push(`location = $${paramCount++}`);
      values.push(encrypt(data.location));
    }
    if (data.targetAudience !== undefined) {
      updates.push(`target_audience = $${paramCount++}`);
      values.push(data.targetAudience);
    }
    if (data.monthlyRevenue !== undefined) {
      updates.push(`monthly_revenue = $${paramCount++}`);
      values.push(encryptNumber(data.monthlyRevenue));
    }
    if (data.employeeCount !== undefined) {
      updates.push(`employee_count = $${paramCount++}`);
      values.push(data.employeeCount);
    }
    if (data.establishedDate !== undefined) {
      updates.push(`established_date = $${paramCount++}`);
      values.push(data.establishedDate);
    }

    // Always update the updated_at timestamp
    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      // Only updated_at would be updated, no actual changes
      const existing = await this.findByUserId(userId);
      if (!existing) {
        throw new Error('Business profile not found');
      }
      return existing;
    }

    values.push(userId);

    const result = await pool.query(
      `UPDATE business_profiles
       SET ${updates.join(', ')}
       WHERE user_id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('Business profile not found');
    }

    return this.mapRowToBusinessProfile(result.rows[0]);
  }

  /**
   * Delete business profile
   */
  static async delete(userId: string): Promise<void> {
    await pool.query('DELETE FROM business_profiles WHERE user_id = $1', [userId]);
  }

  /**
   * Map database row to BusinessProfile type
   */
  private static mapRowToBusinessProfile(row: any): BusinessProfile {
    // Decrypt sensitive data
    const location = decrypt(row.location);
    const monthlyRevenue = row.monthly_revenue 
      ? (typeof row.monthly_revenue === 'string' ? decryptNumber(row.monthly_revenue) : parseFloat(row.monthly_revenue))
      : undefined;
    
    return {
      id: row.id,
      userId: row.user_id,
      businessName: row.business_name,
      businessType: row.business_type,
      industry: row.industry,
      location,
      targetAudience: row.target_audience,
      monthlyRevenue,
      employeeCount: row.employee_count,
      establishedDate: row.established_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
