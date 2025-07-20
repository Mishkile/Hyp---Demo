const Joi = require('joi');

// Product validation schemas
const createProductSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Product name is required',
      'string.min': 'Product name must be at least 1 character',
      'string.max': 'Product name cannot exceed 100 characters',
      'any.required': 'Product name is required'
    }),
  
  description: Joi.string()
    .trim()
    .max(500)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),
  
  price: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.positive': 'Price must be a positive number',
      'number.precision': 'Price cannot have more than 2 decimal places',
      'any.required': 'Product price is required'
    }),
  
  category: Joi.string()
    .trim()
    .min(1)
    .required()
    .messages({
      'string.empty': 'Product category is required',
      'string.min': 'Product category is required',
      'any.required': 'Product category is required'
    }),
  
  stock: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      'number.integer': 'Stock must be an integer',
      'number.min': 'Stock cannot be negative',
      'any.required': 'Stock quantity is required'
    })
});

const updateProductSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.empty': 'Product name cannot be empty',
      'string.min': 'Product name must be at least 1 character',
      'string.max': 'Product name cannot exceed 100 characters'
    }),
  
  description: Joi.string()
    .trim()
    .max(500)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),
  
  price: Joi.number()
    .positive()
    .precision(2)
    .optional()
    .messages({
      'number.positive': 'Price must be a positive number',
      'number.precision': 'Price cannot have more than 2 decimal places'
    }),
  
  category: Joi.string()
    .trim()
    .min(1)
    .optional()
    .messages({
      'string.empty': 'Product category cannot be empty',
      'string.min': 'Product category cannot be empty'
    }),
  
  stock: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.integer': 'Stock must be an integer',
      'number.min': 'Stock cannot be negative'
    })
}).min(1); // At least one field must be provided for update

// Query validation schema
const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().valid('name', 'price', 'category', 'stock', 'createdAt', 'updatedAt', '-name', '-price', '-category', '-stock', '-createdAt', '-updatedAt').default('-createdAt'),
  category: Joi.string().trim(),
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(0),
  search: Joi.string().trim().max(100)
}).custom((value, helpers) => {
  // Validate that maxPrice is greater than minPrice if both are provided
  if (value.minPrice && value.maxPrice && value.maxPrice < value.minPrice) {
    return helpers.error('any.invalid', { message: 'maxPrice must be greater than or equal to minPrice' });
  }
  return value;
});

// Auth validation schemas
const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .lowercase()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters',
      'any.required': 'Password is required'
    })
});

const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .lowercase()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  querySchema,
  registerSchema,
  loginSchema
};