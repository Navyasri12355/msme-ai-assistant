import { Router } from 'express';
import { ProductModel } from '../models/Product';
import { authenticate } from '../middleware/auth';
import { pool } from '../config/database';
import { logger } from '../utils/logger';

const router = Router();
const productModel = new ProductModel(pool);

// Get all products for the authenticated user
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const options = req.query;

    const products = await productModel.findByUserId(userId, options);
    res.json(products);
  } catch (error) {
    logger.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get product statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const stats = await productModel.getStats(userId);
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching product stats:', error);
    res.status(500).json({ error: 'Failed to fetch product statistics' });
  }
});

// Get product categories
router.get('/categories', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const categories = await productModel.getCategories(userId);
    res.json(categories);
  } catch (error) {
    logger.error('Error fetching product categories:', error);
    res.status(500).json({ error: 'Failed to fetch product categories' });
  }
});

// Get a specific product
router.get('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const product = await productModel.findById(id, userId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    logger.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create a new product
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const productData = req.body;

    const product = await productModel.create(userId, productData);
    res.status(201).json(product);
  } catch (error) {
    logger.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update a product
router.put('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const updateData = req.body;

    const product = await productModel.update(id, userId, updateData);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    logger.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete a product
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const deleted = await productModel.delete(id, userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;