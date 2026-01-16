# TABEEB Blog System - Postman Testing Guide

## 📋 Table of Contents
1. [Setup](#setup)
2. [Public Endpoints](#public-endpoints)
3. [Doctor Endpoints](#doctor-endpoints)
4. [Admin Endpoints](#admin-endpoints)
5. [Testing Workflows](#testing-workflows)

---

## 🔧 Setup

### Base URL
```
http://localhost:5002/api/blogs
```

### Authentication
Most endpoints require authentication tokens in headers:

**For Doctors (Firebase Token):**
```
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

**For Admins (Admin JWT Token):**
```
Authorization: Bearer <ADMIN_JWT_TOKEN>
```

To get tokens:
1. **Firebase Token (Doctors):** Login via `/api/user/login` endpoint → Copy `idToken`
2. **Admin JWT Token:** Login via `/api/admin/login` endpoint → Copy `token`

---

## 🌐 Public Endpoints (No Authentication)

### 1. Get All Published Blogs
**GET** `/api/blogs/public`

Query Parameters:
```
page: number (default: 1)
limit: number (default: 20, max: 100)
status: PUBLISHED | DRAFT | ARCHIVED
authorType: DOCTOR | EXTERNAL | ADMIN
isFeatured: boolean
search: string (searches title, content, author)
tag: string (filter by tag slug)
doctorUid: string
sortBy: publishedAt | viewCount | createdAt (default: publishedAt)
sortOrder: asc | desc (default: desc)
```

**Example Request:**
```
GET http://localhost:5002/api/blogs/public?page=1&limit=10&authorType=DOCTOR&sortBy=viewCount&sortOrder=desc
```

**Example Response:**
```json
{
  "blogs": [
    {
      "id": "clxy123abc",
      "title": "Understanding Heart Disease",
      "slug": "understanding-heart-disease",
      "excerpt": "Heart disease is the leading cause of death...",
      "coverImageUrl": "https://res.cloudinary.com/...",
      "readTime": 5,
      "viewCount": 150,
      "authorType": "DOCTOR",
      "authorName": "Dr. John Smith",
      "authorImage": "https://res.cloudinary.com/...",
      "externalSourceName": null,
      "isFeatured": true,
      "publishedAt": "2026-01-10T10:30:00.000Z",
      "tags": [
        {
          "id": "tag123",
          "name": "Cardiology",
          "slug": "cardiology"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

---

### 2. Get Featured Blogs
**GET** `/api/blogs/public/featured`

Query Parameters:
```
limit: number (default: 6)
```

**Example Request:**
```
GET http://localhost:5002/api/blogs/public/featured?limit=6
```

---

### 3. Get Recent Blogs
**GET** `/api/blogs/public/recent`

Query Parameters:
```
limit: number (default: 10)
```

**Example Request:**
```
GET http://localhost:5002/api/blogs/public/recent?limit=10
```

---

### 4. Get Blog by Slug
**GET** `/api/blogs/public/slug/:slug`

**Example Request:**
```
GET http://localhost:5002/api/blogs/public/slug/understanding-heart-disease
```

**Example Response:**
```json
{
  "blog": {
    "id": "clxy123abc",
    "title": "Understanding Heart Disease",
    "slug": "understanding-heart-disease",
    "excerpt": "Heart disease is the leading cause...",
    "contentHtml": "<h2>What is Heart Disease?</h2><p>Heart disease refers to...</p>",
    "coverImageUrl": "https://res.cloudinary.com/...",
    "readTime": 5,
    "viewCount": 151,
    "authorType": "DOCTOR",
    "authorName": "Dr. John Smith",
    "authorImage": "https://res.cloudinary.com/...",
    "externalSourceName": null,
    "isFeatured": true,
    "publishedAt": "2026-01-10T10:30:00.000Z",
    "seoTitle": "Understanding Heart Disease | TABEEB Health Blog",
    "seoDescription": "Learn about heart disease, symptoms, and prevention...",
    "externalAuthorBio": null,
    "externalSourceUrl": null,
    "canonicalUrl": null,
    "createdAt": "2026-01-08T15:20:00.000Z",
    "updatedAt": "2026-01-10T10:30:00.000Z",
    "tags": [
      {
        "id": "tag123",
        "name": "Cardiology",
        "slug": "cardiology"
      }
    ],
    "doctor": {
      "uid": "doctor123",
      "name": "Dr. John Smith",
      "profileImageUrl": "https://res.cloudinary.com/...",
      "specialization": "Cardiologist",
      "qualification": "MBBS, MD"
    }
  },
  "similarBlogs": [
    {
      "id": "clxy456def",
      "title": "Heart Health Tips",
      "slug": "heart-health-tips",
      "excerpt": "Keep your heart healthy with these tips...",
      "coverImageUrl": "https://res.cloudinary.com/...",
      "readTime": 3,
      "viewCount": 89,
      "authorType": "DOCTOR",
      "authorName": "Dr. John Smith",
      "authorImage": "https://res.cloudinary.com/...",
      "externalSourceName": null,
      "isFeatured": false,
      "publishedAt": "2026-01-05T14:00:00.000Z",
      "tags": [
        {
          "id": "tag123",
          "name": "Cardiology",
          "slug": "cardiology"
        }
      ]
    }
  ]
}
```

---

### 5. Search Blogs
**POST** `/api/blogs/public/search`

**Request Body:**
```json
{
  "query": "diabetes",
  "limit": 20
}
```

**Example Response:**
```json
{
  "blogs": [
    {
      "id": "clxy789ghi",
      "title": "Managing Type 2 Diabetes",
      "slug": "managing-type-2-diabetes",
      "excerpt": "Learn how to effectively manage diabetes...",
      "coverImageUrl": "https://res.cloudinary.com/...",
      "readTime": 7,
      "viewCount": 203,
      "authorType": "DOCTOR",
      "authorName": "Dr. Sarah Ahmed",
      "authorImage": "https://res.cloudinary.com/...",
      "externalSourceName": null,
      "isFeatured": false,
      "publishedAt": "2026-01-12T09:00:00.000Z",
      "tags": [
        {
          "id": "tag456",
          "name": "Diabetes",
          "slug": "diabetes"
        }
      ]
    }
  ]
}
```

---

### 6. Get All Tags
**GET** `/api/blogs/public/tags`

**Example Response:**
```json
{
  "tags": [
    {
      "id": "tag123",
      "name": "Cardiology",
      "slug": "cardiology",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "_count": {
        "blogs": 15
      }
    },
    {
      "id": "tag456",
      "name": "Diabetes",
      "slug": "diabetes",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "_count": {
        "blogs": 12
      }
    }
  ]
}
```

---

## 👨‍⚕️ Doctor Endpoints (Authentication Required)

### 7. Create Blog (Doctor)
**POST** `/api/blogs/create`

**Headers:**
```
Authorization: Bearer <FIREBASE_ID_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Understanding Hypertension in 2026",
  "contentHtml": "<h2>What is Hypertension?</h2><p>Hypertension, also known as high blood pressure, is a chronic condition...</p><h3>Symptoms</h3><ul><li>Headaches</li><li>Dizziness</li><li>Chest pain</li></ul>",
  "excerpt": "Learn about hypertension, its symptoms, causes, and modern treatment approaches.",
  "coverImageUrl": "https://res.cloudinary.com/tabeeb/image/upload/v123456/blogs/cover-hypertension.jpg",
  "coverImagePublicId": "blogs/cover-hypertension",
  "seoTitle": "Understanding Hypertension: Complete Guide 2026",
  "seoDescription": "Comprehensive guide to hypertension including symptoms, causes, treatment, and prevention strategies.",
  "authorType": "DOCTOR",
  "doctorUid": "doctor_uid_from_firebase",
  "tags": ["Cardiology", "Heart Health", "Hypertension", "Blood Pressure"],
  "status": "PUBLISHED",
  "isFeatured": false
}
```

**Example Response:**
```json
{
  "message": "Blog created successfully",
  "blog": {
    "id": "clxy987jkl",
    "title": "Understanding Hypertension in 2026",
    "slug": "understanding-hypertension-in-2026",
    "excerpt": "Learn about hypertension, its symptoms...",
    "coverImageUrl": "https://res.cloudinary.com/...",
    "readTime": 6,
    "viewCount": 0,
    "authorType": "DOCTOR",
    "authorName": "Dr. Ahmed Khan",
    "authorImage": "https://res.cloudinary.com/...",
    "externalSourceName": null,
    "isFeatured": false,
    "publishedAt": "2026-01-15T10:00:00.000Z",
    "tags": [
      {
        "id": "tag789",
        "name": "Cardiology",
        "slug": "cardiology"
      },
      {
        "id": "tag790",
        "name": "Hypertension",
        "slug": "hypertension"
      }
    ]
  }
}
```

**Validation Rules:**
- ✅ `title`: Required, 1-500 characters
- ✅ `contentHtml`: Required, minimum 100 characters
- ✅ `coverImageUrl`: Required
- ✅ `authorType`: Must be "DOCTOR" for doctor blogs
- ✅ `doctorUid`: Required and must match authenticated user
- ✅ `status`: Optional (DRAFT | PUBLISHED | ARCHIVED), defaults to DRAFT
- ✅ `tags`: Optional array of tag names (3-10 recommended)

---

### 8. Get My Blogs (Doctor)
**GET** `/api/blogs/my-blogs`

**Headers:**
```
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

**Query Parameters:**
```
page: number (default: 1)
limit: number (default: 20)
status: PUBLISHED | DRAFT | ARCHIVED
```

**Example Request:**
```
GET http://localhost:5002/api/blogs/my-blogs?page=1&limit=10&status=PUBLISHED
```

---

### 9. Update Blog
**PUT** `/api/blogs/:id`

**Headers:**
```
Authorization: Bearer <FIREBASE_ID_TOKEN or ADMIN_JWT_TOKEN>
Content-Type: application/json
```

**Request Body (all fields optional):**
```json
{
  "title": "Updated: Understanding Hypertension in 2026",
  "contentHtml": "<h2>Updated Content</h2><p>New information about hypertension...</p>",
  "excerpt": "Updated excerpt with new information...",
  "coverImageUrl": "https://res.cloudinary.com/tabeeb/image/upload/v123457/blogs/new-cover.jpg",
  "tags": ["Cardiology", "Hypertension", "Prevention"],
  "status": "PUBLISHED",
  "isFeatured": false
}
```

**Example Request:**
```
PUT http://localhost:5002/api/blogs/clxy987jkl
```

**Permissions:**
- ✅ Doctors can only update their own blogs
- ✅ Admins can update any blog

---

### 10. Delete Blog
**DELETE** `/api/blogs/:id`

**Headers:**
```
Authorization: Bearer <FIREBASE_ID_TOKEN or ADMIN_JWT_TOKEN>
```

**Example Request:**
```
DELETE http://localhost:5002/api/blogs/clxy987jkl
```

**Example Response:**
```json
{
  "message": "Blog deleted successfully"
}
```

**Permissions:**
- ✅ Doctors can only delete their own blogs
- ✅ Admins can delete any blog

---

## 🔐 Admin Endpoints (Admin JWT Token Required)

### 11. Create Blog (Admin/External)
**POST** `/api/blogs/create`

**Headers:**
```
Authorization: Bearer <ADMIN_JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Latest Medical Research from Harvard",
  "contentHtml": "<h2>Groundbreaking Study</h2><p>Researchers at Harvard Medical School have discovered...</p>",
  "excerpt": "Harvard researchers make breakthrough discovery in cancer treatment.",
  "coverImageUrl": "https://res.cloudinary.com/tabeeb/image/upload/v123458/blogs/harvard-research.jpg",
  "coverImagePublicId": "blogs/harvard-research",
  "seoTitle": "Harvard Medical Research: Cancer Treatment Breakthrough",
  "seoDescription": "New research from Harvard Medical School shows promising results in cancer treatment.",
  "authorType": "EXTERNAL",
  "externalAuthorName": "Dr. Emily Johnson",
  "externalAuthorBio": "Dr. Emily Johnson is a Professor of Oncology at Harvard Medical School with over 20 years of experience in cancer research.",
  "authorImageUrl": "https://res.cloudinary.com/tabeeb/image/upload/v123459/authors/emily-johnson.jpg",
  "authorImagePublicId": "authors/emily-johnson",
  "externalSourceName": "Harvard Health Publishing",
  "externalSourceUrl": "https://www.health.harvard.edu/original-article",
  "canonicalUrl": "https://www.health.harvard.edu/blog/original-article-url",
  "tags": ["Cancer", "Medical Research", "Harvard", "Oncology"],
  "status": "PUBLISHED",
  "isFeatured": true,
  "featuredOrder": 1
}
```

**Validation for External Blogs:**
- ✅ `authorType`: Must be "EXTERNAL" or "ADMIN"
- ✅ `externalAuthorName`: Required
- ✅ `externalAuthorBio`: Recommended for credibility
- ✅ `authorImageUrl`: Required for external authors
- ✅ `canonicalUrl`: Required for external blogs (SEO)
- ❌ `doctorUid`: Must NOT be provided

---

### 12. Get All Blogs (Admin)
**GET** `/api/blogs/admin/all`

**Headers:**
```
Authorization: Bearer <ADMIN_JWT_TOKEN>
```

**Query Parameters:** (Same as public endpoint, but can see all statuses)
```
page: 1
limit: 20
status: DRAFT | PUBLISHED | ARCHIVED (can see all)
```

**Example Request:**
```
GET http://localhost:5002/api/blogs/admin/all?status=DRAFT&page=1
```

---

### 13. Toggle Featured Status (Admin)
**PATCH** `/api/blogs/admin/:id/feature`

**Headers:**
```
Authorization: Bearer <ADMIN_JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "isFeatured": true,
  "featuredOrder": 1
}
```

**Example Request:**
```
PATCH http://localhost:5002/api/blogs/admin/clxy987jkl/feature
```

**Example Response:**
```json
{
  "message": "Featured status updated successfully",
  "blog": {
    "id": "clxy987jkl",
    "title": "Understanding Hypertension in 2026",
    "slug": "understanding-hypertension-in-2026",
    "isFeatured": true,
    "featuredOrder": 1,
    ...
  }
}
```

---

## 🧪 Testing Workflows

### Workflow 1: Doctor Creates and Publishes Blog

1. **Login as Doctor**
   ```
   POST /api/user/login
   Body: { email, password }
   → Save idToken
   ```

2. **Upload Cover Image to Cloudinary** (via existing upload endpoint or directly to Cloudinary)

3. **Create Blog as Draft**
   ```
   POST /api/blogs/create
   Authorization: Bearer <idToken>
   Body: { 
     title, contentHtml, coverImageUrl,
     authorType: "DOCTOR", 
     doctorUid: "<your_uid>",
     tags: ["Tag1", "Tag2"],
     status: "DRAFT"
   }
   → Save blog id
   ```

4. **Preview Draft**
   ```
   GET /api/blogs/my-blogs?status=DRAFT
   ```

5. **Update and Publish**
   ```
   PUT /api/blogs/<blog_id>
   Body: { status: "PUBLISHED" }
   ```

6. **Verify Published**
   ```
   GET /api/blogs/public/slug/<blog-slug>
   → Should now be visible publicly
   ```

---

### Workflow 2: Admin Uploads External Blog

1. **Login as Admin**
   ```
   POST /api/admin/login
   Body: { username, password }
   → Save JWT token
   ```

2. **Upload Cover & Author Images**

3. **Create External Blog**
   ```
   POST /api/blogs/create
   Authorization: Bearer <admin_jwt_token>
   Body: { 
     title, contentHtml, coverImageUrl,
     authorType: "EXTERNAL",
     externalAuthorName: "Dr. External",
     externalAuthorBio: "Bio...",
     authorImageUrl: "...",
     externalSourceName: "Harvard Health",
     externalSourceUrl: "https://...",
     canonicalUrl: "https://...",
     tags: ["Research", "Cancer"],
     status: "PUBLISHED",
     isFeatured: true,
     featuredOrder: 1
   }
   ```

4. **Verify Featured**
   ```
   GET /api/blogs/public/featured
   → Should appear in featured list
   ```

---

### Workflow 3: Browse and Search (Patient/Public)

1. **Get Recent Blogs**
   ```
   GET /api/blogs/public/recent?limit=10
   ```

2. **Get Featured Blogs**
   ```
   GET /api/blogs/public/featured
   ```

3. **Search by Keyword**
   ```
   POST /api/blogs/public/search
   Body: { query: "diabetes", limit: 20 }
   ```

4. **Filter by Tag**
   ```
   GET /api/blogs/public?tag=cardiology
   ```

5. **Read Full Blog**
   ```
   GET /api/blogs/public/slug/understanding-hypertension-in-2026
   → View count increments
   → Similar blogs returned
   ```

---

## 📊 Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (no token or invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found (blog doesn't exist) |
| 500 | Server Error |

---

## 🔍 Common Errors

### 1. Author Validation Error
```json
{
  "error": "Doctor blogs require doctorUid"
}
```
**Fix:** Ensure `doctorUid` is provided when `authorType` is "DOCTOR"

### 2. Permission Denied
```json
{
  "error": "Not authorized to update this blog"
}
```
**Fix:** Doctors can only update their own blogs. Use admin account for others.

### 3. Slug Conflict
Automatically handled - system appends number if slug exists (e.g., `blog-title-1`)

### 4. Invalid CUID
```json
{
  "error": "Invalid id format"
}
```
**Fix:** Ensure blog ID starts with 'c' and has 25 characters total

---

## 💡 Tips for Testing

1. **Use Postman Environment Variables:**
   ```
   {{baseUrl}} = http://localhost:5002
   {{doctorToken}} = <doctor_firebase_token>
   {{adminToken}} = <admin_jwt_token>
   {{blogId}} = <created_blog_id>
   ```

2. **Test HTML Sanitization:**
   Try injecting `<script>alert('XSS')</script>` in contentHtml - should be stripped

3. **Test View Count:**
   Call slug endpoint multiple times - view count should increment atomically

4. **Test Similar Blogs:**
   Create multiple blogs with same tags/author - verify similarity algorithm

5. **Test Slug Generation:**
   Create blogs with special characters in title - verify clean slug generation

---

## 🚀 Ready to Test!

Import this guide into Postman or use the examples above to test all blog endpoints.

For any issues, check:
- ✅ Token is valid (Firebase for doctors, Admin JWT for admins)
- ✅ User role matches endpoint requirements
- ✅ Request body follows validation rules
- ✅ Database connection is active

Happy Testing! 🎉
