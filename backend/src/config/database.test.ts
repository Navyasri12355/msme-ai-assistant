import { pool, query } from './database';

describe('Database Configuration', () => {
  afterAll(async () => {
    await pool.end();
  });

  it('should connect to the database', async () => {
    const result = await query('SELECT 1 as value');
    expect(result.rows[0].value).toBe(1);
  });

  it('should execute queries successfully', async () => {
    const result = await query('SELECT NOW() as current_time');
    expect(result.rows[0].current_time).toBeInstanceOf(Date);
  });
});
