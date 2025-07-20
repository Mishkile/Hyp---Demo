const express = require('express');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats
} = require('../controllers/productController');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validation');
const {
  createProductSchema,
  updateProductSchema,
  querySchema
} = require('../validation/schemas');

const router = express.Router();

// @route   GET /api/v1/products/stats
router.get('/stats', getProductStats);

// @route   GET /api/v1/products
router.get('/', validate(querySchema, 'query'), getProducts);

// @route   GET /api/v1/products/:id
router.get('/:id', getProduct);

// @route   POST /api/v1/products
router.post('/', auth, validate(createProductSchema), createProduct);

// @route   PUT /api/v1/products/:id
router.put('/:id', auth, validate(updateProductSchema), updateProduct);

// @route   DELETE /api/v1/products/:id
router.delete('/:id', auth, deleteProduct);

module.exports = router;