const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../src/app');
const Product = require('../../src/models/Product');
const User = require('../../src/models/User');

let mongoServer;
let authToken;
let testUser;

describe('Products API', () => {
  beforeAll(async () => {
    // Start in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create a test user and get auth token
    testUser = await User.create({
      email: 'test@example.com',
      password: 'password123'
    });

    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    authToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Product.deleteMany({});
  });

  describe('GET /api/v1/products', () => {
    it('should get all products with pagination', async () => {
      // Create test products
      await Product.create([
        { name: 'Product 1', price: 10.99, category: 'Electronics', stock: 5 },
        { name: 'Product 2', price: 20.99, category: 'Books', stock: 10 }
      ]);

      const response = await request(app)
        .get('/api/v1/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1
      });
    });

    it('should filter products by category', async () => {
      await Product.create([
        { name: 'Laptop', price: 999.99, category: 'Electronics', stock: 3 },
        { name: 'Book', price: 15.99, category: 'Books', stock: 20 }
      ]);

      const response = await request(app)
        .get('/api/v1/products?category=Electronics')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].category).toBe('Electronics');
    });

    it('should search products by name', async () => {
      await Product.create([
        { name: 'iPhone 13', price: 799.99, category: 'Electronics', stock: 5 },
        { name: 'Samsung Galaxy', price: 699.99, category: 'Electronics', stock: 8 }
      ]);

      const response = await request(app)
        .get('/api/v1/products?search=iPhone')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('iPhone 13');
    });
  });

  describe('GET /api/v1/products/:id', () => {
    it('should get a single product by ID', async () => {
      const product = await Product.create({
        name: 'Test Product',
        price: 29.99,
        category: 'Test',
        stock: 15
      });

      const response = await request(app)
        .get(`/api/v1/products/${product._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Product');
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/v1/products/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND');
    });
  });

  describe('POST /api/v1/products', () => {
    it('should create a new product when authenticated', async () => {
      const productData = {
        name: 'New Product',
        description: 'A great product',
        price: 49.99,
        category: 'Test Category',
        stock: 25
      };

      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New Product');
      expect(response.body.data.price).toBe(49.99);
    });

    it('should require authentication', async () => {
      const productData = {
        name: 'Unauthorized Product',
        price: 99.99,
        category: 'Test',
        stock: 5
      };

      const response = await request(app)
        .post('/api/v1/products')
        .send(productData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    it('should validate required fields', async () => {
      const invalidProduct = {
        name: '',
        price: -10,
        stock: -5
      };

      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidProduct)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /api/v1/products/:id', () => {
    it('should update an existing product', async () => {
      const product = await Product.create({
        name: 'Original Product',
        price: 19.99,
        category: 'Original',
        stock: 10
      });

      const updateData = {
        name: 'Updated Product',
        price: 29.99
      };

      const response = await request(app)
        .put(`/api/v1/products/${product._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Product');
      expect(response.body.data.price).toBe(29.99);
    });
  });

  describe('DELETE /api/v1/products/:id', () => {
    it('should delete an existing product', async () => {
      const product = await Product.create({
        name: 'Product to Delete',
        price: 39.99,
        category: 'Delete',
        stock: 1
      });

      const response = await request(app)
        .delete(`/api/v1/products/${product._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product deleted successfully');

      // Verify product was deleted
      const deletedProduct = await Product.findById(product._id);
      expect(deletedProduct).toBeNull();
    });
  });

  describe('GET /api/v1/products/stats', () => {
    it('should return product statistics', async () => {
      await Product.create([
        { name: 'Product 1', price: 10.00, category: 'A', stock: 5 },
        { name: 'Product 2', price: 20.00, category: 'A', stock: 3 },
        { name: 'Product 3', price: 30.00, category: 'B', stock: 2 }
      ]);

      const response = await request(app)
        .get('/api/v1/products/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.overall.totalProducts).toBe(3);
      expect(response.body.data.overall.averagePrice).toBe(20);
      expect(response.body.data.byCategory).toHaveLength(2);
    });
  });
});