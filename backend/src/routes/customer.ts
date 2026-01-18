import { Router } from 'express';
import { CustomerModel } from '../models/Customer';
import { authenticate } from '../middleware/auth';
import { pool } from '../config/database';
import { logger } from '../utils/logger';

const router = Router();
const customerModel = new CustomerModel(pool);

// Get all customers for the authenticated user
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const options = req.query;

    const customers = await customerModel.findByUserId(userId, options);
    res.json(customers);
  } catch (error) {
    logger.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get customer statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const stats = await customerModel.getStats(userId);
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching customer stats:', error);
    res.status(500).json({ error: 'Failed to fetch customer statistics' });
  }
});

// Get a specific customer
router.get('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const customer = await customerModel.findById(id, userId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    logger.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// Create a new customer
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const customerData = req.body;

    const customer = await customerModel.create(userId, customerData);
    res.status(201).json(customer);
  } catch (error) {
    logger.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Update a customer
router.put('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const updateData = req.body;

    const customer = await customerModel.update(id, userId, updateData);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    logger.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Delete a customer
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const deleted = await customerModel.delete(id, userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

export default router;