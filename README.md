# Blog Admin Backend

Express.js + Mongoose REST API for blog admin panel.

## Setup

```bash
cd blog-admin-backend
npm install
cp .env.example .env   # fill in your values
npm run dev
```

## Seed first admin

```bash
# Ensure ADMIN_EMAIL and ADMIN_PASSWORD are set in .env, then:
curl -X POST http://localhost:5000/api/auth/seed
```

## API Reference

### Auth
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/login` | — | Login |
| GET | `/api/auth/me` | ✅ | Get current admin |
| PUT | `/api/auth/change-password` | ✅ | Change password |
| POST | `/api/auth/seed` | — | Create first admin (dev only) |

### Blogs — Public
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/blogs/published` | All published blogs |
| GET | `/api/blogs/public/:slug` | Blog by slug + increment view |

### Blogs — Admin (requires Bearer token)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/blogs` | List all with filters |
| GET | `/api/blogs/stats` | Dashboard stats |
| GET | `/api/blogs/:id` | Single blog by id or slug |
| POST | `/api/blogs` | Create blog |
| PUT | `/api/blogs/:id` | Update blog |
| PATCH | `/api/blogs/:id/status` | Toggle published/draft |
| PATCH | `/api/blogs/:id/featured` | Toggle featured |
| DELETE | `/api/blogs/:id` | Delete blog |
| POST | `/api/blogs/bulk` | Bulk publish/draft/delete |

### Upload (requires Bearer token)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/upload/image` | Upload image (multipart/form-data, field: `image`) |
| DELETE | `/api/upload/:filename` | Delete uploaded image |

## Query Params for GET /api/blogs

- `status` — `published` | `draft`
- `tag` — e.g. `BIS`, `WPC`
- `featured` — `true` | `false`
- `search` — text search in title/excerpt/tags
- `page` — page number (default 1)
- `limit` — per page (default 20, max 50)

## Folder Structure

```
blog-admin-backend/
├── config/
│   └── db.js
├── controllers/
│   ├── authController.js
│   ├── blogController.js
│   └── uploadController.js
├── middleware/
│   ├── authMiddleware.js
│   ├── errorMiddleware.js
│   ├── rateLimiter.js
│   └── uploadMiddleware.js
├── models/
│   ├── Admin.js
│   └── Blog.js
├── routes/
│   ├── authRoutes.js
│   ├── blogRoutes.js
│   └── uploadRoutes.js
├── uploads/           ← auto-created
├── utils/
│   ├── AppError.js
│   └── asyncHandler.js
├── .env.example
├── package.json
├── README.md
└── server.js
```
