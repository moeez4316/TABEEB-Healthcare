# Admin Blog Creation - Implementation Summary

## Overview
Implemented complete admin blog creation functionality, allowing administrators to create blog posts with three different author types: ADMIN, EXTERNAL, and DOCTOR (impersonation).

## Files Modified

### 1. `/src/lib/api/blog-api.ts`
**Added Functions:**
- `adminCreateBlog(blogData, adminToken)` - Create blog posts as admin
- `adminUpdateBlog(blogId, blogData, adminToken)` - Update any blog post (for future edit functionality)

Both functions use the existing backend endpoints with admin JWT authentication.

### 2. `/src/app/admin/blogs/page.tsx`
**Changes:**
- Added `PlusCircle` icon import
- Added "Create Blog" button in header that links to `/admin/blogs/write`
- Button is styled with teal color matching the system design

## New File Created

### 3. `/src/app/admin/blogs/write/page.tsx`
**Complete admin blog creation page with:**

#### Core Features:
- **Title Input** - Required field
- **Excerpt/Summary** - Optional, 500 char limit with counter
- **Rich Text Editor** - Full HTML content editor (reuses existing RichTextEditor component)
- **Preview Mode** - Toggle between edit and preview
- **Save Draft** - Save as DRAFT status
- **Publish** - Save as PUBLISHED status

#### Author Type Selection (3 Types):

1. **ADMIN (System)**
   - Default option
   - Blog attributed to TABEEB system/admin
   - No additional fields required

2. **EXTERNAL Author**
   - For guest authors or external content
   - Required fields:
     - Author Name *
     - Author Bio (optional)
     - Author Image (optional upload)
     - Source Name (e.g., "Medium", "Dev.to")
     - Source URL (link to original)

3. **DOCTOR (Impersonate)**
   - Admin can create blogs on behalf of doctors
   - Required field:
     - Doctor Firebase UID *
   - Blog will appear as written by that doctor

#### Additional Features:

**Cover Image Upload:**
- Required field
- Supports PNG, JPG up to 5MB
- Upload to Cloudinary via `/api/upload` endpoint
- Preview with remove option

**Tags:**
- Add multiple tags
- Enter key to add
- Click X to remove
- Displayed as teal pills

**SEO Settings:**
- SEO Title (optional)
- SEO Description (optional)
- Canonical URL (optional, for external content)

**Featured Settings:**
- Checkbox to mark as featured
- Featured Order number (lower = higher priority)
- Only shown when featured checkbox is checked

**UI/UX:**
- Sticky header with navigation
- Success/Error message banners
- Loading states for all async operations
- Responsive grid layout (2-column on large screens)
- Dark mode support
- Matches Doctor blog creation design pattern

## Backend Integration

### Authentication:
- Uses `adminToken` from localStorage
- Sends token in `Authorization: Bearer {token}` header
- Backend endpoint: `/api/blogs/create` (same as doctor, but with admin token)

### Endpoint Used:
- **POST** `/api/blogs/create`
  - Accepts both Firebase JWT (doctors) and Admin JWT (admins)
  - Middleware: `verifyTokenOrAdmin` + `isDoctorOrAdmin`
  - Validates with `validateCreateBlog`

### Request Body Structure:
```typescript
{
  title: string,              // Required
  contentHtml: string,        // Required
  excerpt?: string,           // Optional
  coverImageUrl: string,      // Required
  tags?: string[],           // Optional
  status: 'DRAFT' | 'PUBLISHED',
  authorType: 'ADMIN' | 'EXTERNAL' | 'DOCTOR',
  
  // For EXTERNAL:
  externalAuthorName?: string,
  externalAuthorBio?: string,
  authorImageUrl?: string,
  externalSourceName?: string,
  externalSourceUrl?: string,
  
  // For DOCTOR:
  doctorUid?: string,
  
  // SEO:
  seoTitle?: string,
  seoDescription?: string,
  canonicalUrl?: string,
  
  // Featured:
  isFeatured?: boolean,
  featuredOrder?: number
}
```

## User Flow

1. **Navigate to Blog Management:**
   - Admin sidebar → "Blog Management"
   - Lands on `/admin/blogs` page

2. **Click "Create Blog":**
   - Green button in top-right corner
   - Navigates to `/admin/blogs/write`

3. **Fill in Blog Details:**
   - Enter title, excerpt (optional), content
   - Upload cover image
   - Select author type and fill corresponding fields
   - Add tags (optional)
   - Configure SEO settings (optional)
   - Set featured status (optional)

4. **Submit:**
   - Click "Save Draft" for draft status
   - Click "Publish" for published status
   - Shows success message
   - Auto-redirects to `/admin/blogs` after 2 seconds

5. **View Created Blog:**
   - Returns to blog management page
   - New blog appears in table
   - Can toggle featured, view, or delete

## Validation

**Client-side:**
- Title required
- Content required
- Cover image required
- For EXTERNAL: Author name required
- For DOCTOR: Doctor UID required
- Image size limit (5MB)
- Image type validation (image/*)
- Excerpt max length (500 chars)

**Server-side:**
- All backend validations apply via `validateCreateBlog` middleware
- Author type validation
- Doctor UID existence check (for DOCTOR type)
- Admin authentication required

## Future Enhancements (Not Implemented Yet)

1. **Edit Functionality:**
   - Admin edit page at `/admin/blogs/edit/[id]`
   - Pre-populate form with existing blog data
   - Use `adminUpdateBlog` API function
   - Similar to doctor edit page

2. **Doctor UID Lookup:**
   - Dropdown to select doctor from existing doctors
   - Auto-populate UID instead of manual entry
   - Would require doctor list API endpoint

3. **Draft Auto-save:**
   - Periodic auto-save to prevent data loss
   - Local storage backup

4. **Image Library:**
   - Browse previously uploaded images
   - Reuse existing cover images

5. **Bulk Actions:**
   - Select multiple blogs
   - Bulk delete, publish, feature

## Testing Checklist

- [ ] Can access write page from blog management
- [ ] All three author types work correctly
- [ ] Image upload for cover and author images
- [ ] Tags can be added and removed
- [ ] Preview mode displays correctly
- [ ] Draft saves successfully
- [ ] Publish works correctly
- [ ] Validation errors show properly
- [ ] Success message and redirect work
- [ ] Created blog appears in blog management table
- [ ] Featured settings apply correctly
- [ ] SEO fields save correctly
- [ ] Dark mode works on all components

## Notes

- Reuses existing `RichTextEditor` component from doctor blog
- Follows same design patterns as doctor blog creation
- Admin has full control over all blog fields
- No restrictions on content or status changes
- Can create blogs on behalf of any doctor using their UID
- External author blogs useful for guest posts or curated content
