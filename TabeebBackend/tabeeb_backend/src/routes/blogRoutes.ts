import express from 'express';
import { verifyToken } from '../middleware/verifyToken';
import { verifyTokenOrAdmin } from '../middleware/verifyTokenOrAdmin';
import { authenticateAdminFromHeaders } from '../middleware/adminAuth';
import {
  validateCreateBlog,
  validateUpdateBlog,
  validateBlogQuery,
  validateCUID,
  validateSlug,
  isDoctor,
  isAdmin,
  isDoctorOrAdmin
} from '../middleware/blogValidation';
import {
  createBlog,
  getAllBlogs,
  getBlogBySlug,
  getBlogById,
  getFeaturedBlogs,
  getRecentBlogs,
  getMyBlogs,
  updateBlog,
  deleteBlog,
  toggleFeatured,
  searchBlogs,
  getAllTags
} from '../controllers/blogController';

const router = express.Router();

// Public routes (no authentication required)
router.get('/public', validateBlogQuery, getAllBlogs); // Get all published blogs
router.get('/public/featured', getFeaturedBlogs); // Get featured blogs
router.get('/public/recent', getRecentBlogs); // Get recent blogs
router.get('/public/slug/:slug', validateSlug, getBlogBySlug); // Get blog by slug
router.post('/public/search', searchBlogs); // Search blogs
router.get('/public/tags', getAllTags); // Get all tags

// Protected routes - Doctor/Admin can create (accepts both Firebase and Admin JWT tokens)
router.post('/create', verifyTokenOrAdmin, isDoctorOrAdmin, validateCreateBlog, createBlog);

// Protected routes - Doctor (own blogs only)
router.get('/my-blogs', verifyToken, isDoctor, getMyBlogs); // Get current doctor's blogs
router.get('/:id', verifyTokenOrAdmin, validateCUID('id'), getBlogById); // Get single blog by ID for editing
router.put('/:id', verifyTokenOrAdmin, validateCUID('id'), validateUpdateBlog, updateBlog); // Update blog (checks ownership/admin)
router.delete('/:id', verifyTokenOrAdmin, validateCUID('id'), deleteBlog); // Delete blog (checks ownership/admin)

// Protected routes - Admin only (uses admin JWT token)
router.patch('/admin/:id/feature', authenticateAdminFromHeaders, validateCUID('id'), toggleFeatured); // Toggle featured status
router.get('/admin/all', authenticateAdminFromHeaders, validateBlogQuery, getAllBlogs); // Get all blogs (including drafts)

export default router;
