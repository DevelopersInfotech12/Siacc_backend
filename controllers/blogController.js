import slugify from "slugify";
import Blog from "../models/Blog.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

// ── Helpers ──────────────────────────────────────────────────
const makeSlug = (title) =>
  slugify(title, { lower: true, strict: true, trim: true });

const buildQuery = (queryParams) => {
  const { status, tag, featured, search } = queryParams;
  const filter = {};
  if (status) filter.status = status;
  if (tag) filter.tag = tag;
  if (featured !== undefined) filter.featured = featured === "true";
  if (search) filter.$or = [
    { title: { $regex: search, $options: "i" } },
    { excerpt: { $regex: search, $options: "i" } },
    { tags: { $in: [new RegExp(search, "i")] } },
  ];
  return filter;
};

// ── GET /api/blogs ─ list all (admin)
export const getBlogs = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;
  const filter = buildQuery(req.query);

  const [blogs, total] = await Promise.all([
    Blog.find(filter)
      .select("slug title tag date status featured readTime author views createdAt updatedAt img excerpt seo")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Blog.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: blogs,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// ── GET /api/blogs/published ─ public listing
export const getPublishedBlogs = asyncHandler(async (req, res) => {
  const blogs = await Blog.find({ status: "published" })
    .select("slug title tag date featured readTime author img excerpt tagStyle heroImg heroGradient tags highlights related")
    .sort({ featured: -1, createdAt: -1 })
    .lean();

  res.json({ success: true, data: blogs });
});

// ── GET /api/blogs/stats ─ dashboard stats
export const getBlogStats = asyncHandler(async (req, res) => {
  const [total, published, drafts, featured, byTag] = await Promise.all([
    Blog.countDocuments(),
    Blog.countDocuments({ status: "published" }),
    Blog.countDocuments({ status: "draft" }),
    Blog.countDocuments({ featured: true }),
    Blog.aggregate([{ $group: { _id: "$tag", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
  ]);

  res.json({ success: true, data: { total, published, drafts, featured, byTag } });
});

// ── GET /api/blogs/:id ─ single blog (admin by id or slug)
export const getBlogById = asyncHandler(async (req, res) => {
  const query = req.params.id.match(/^[0-9a-fA-F]{24}$/)
    ? { _id: req.params.id }
    : { slug: req.params.id };

  const blog = await Blog.findOne(query).lean();
  if (!blog) throw new AppError("Blog not found", 404);

  res.json({ success: true, data: blog });
});

// ── GET /api/blogs/public/:slug ─ public detail + increment view
export const getBlogBySlug = asyncHandler(async (req, res) => {
  const blog = await Blog.findOneAndUpdate(
    { slug: req.params.slug, status: "published" },
    { $inc: { views: 1 } },
    { new: true }
  ).lean();

  if (!blog) throw new AppError("Blog not found", 404);
  res.json({ success: true, data: blog });
});

// ── POST /api/blogs ─ create
export const createBlog = asyncHandler(async (req, res) => {
  const body = req.body;

  // Auto-generate slug from title if not provided
  if (!body.slug && body.title) {
    body.slug = makeSlug(body.title);
  }

  // Check slug uniqueness
  const existing = await Blog.findOne({ slug: body.slug });
  if (existing) {
    body.slug = `${body.slug}-${Date.now()}`;
  }

  // Auto-populate SEO fields from content if not provided
  if (body.seo) {
    if (!body.seo.metaTitle) body.seo.metaTitle = body.title;
    if (!body.seo.metaDescription) body.seo.metaDescription = body.excerpt?.substring(0, 160);
    if (!body.seo.ogTitle) body.seo.ogTitle = body.title;
    if (!body.seo.ogDescription) body.seo.ogDescription = body.excerpt?.substring(0, 200);
    if (!body.seo.ogImage) body.seo.ogImage = body.img;
  }

  const blog = await Blog.create(body);

  res.status(201).json({ success: true, data: blog, message: "Blog created successfully" });
});

// ── PUT /api/blogs/:id ─ update
export const updateBlog = asyncHandler(async (req, res) => {
  const body = req.body;

  // If title changed and slug should update
  if (body.regenerateSlug && body.title) {
    const newSlug = makeSlug(body.title);
    const conflict = await Blog.findOne({ slug: newSlug, _id: { $ne: req.params.id } });
    body.slug = conflict ? `${newSlug}-${Date.now()}` : newSlug;
    delete body.regenerateSlug;
  }

  const blog = await Blog.findByIdAndUpdate(req.params.id, body, {
    new: true,
    runValidators: true,
  });

  if (!blog) throw new AppError("Blog not found", 404);

  res.json({ success: true, data: blog, message: "Blog updated successfully" });
});

// ── PATCH /api/blogs/:id/status ─ toggle publish/draft
export const toggleStatus = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) throw new AppError("Blog not found", 404);

  blog.status = blog.status === "published" ? "draft" : "published";
  await blog.save();

  res.json({
    success: true,
    data: { status: blog.status },
    message: `Blog ${blog.status === "published" ? "published" : "moved to draft"}`,
  });
});

// ── PATCH /api/blogs/:id/featured ─ toggle featured
export const toggleFeatured = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) throw new AppError("Blog not found", 404);

  // Only one featured at a time
  if (!blog.featured) {
    await Blog.updateMany({ featured: true }, { featured: false });
  }
  blog.featured = !blog.featured;
  await blog.save();

  res.json({ success: true, data: { featured: blog.featured }, message: "Featured status updated" });
});

// ── DELETE /api/blogs/:id ─ delete
export const deleteBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findByIdAndDelete(req.params.id);
  if (!blog) throw new AppError("Blog not found", 404);

  res.json({ success: true, message: "Blog deleted successfully" });
});

// ── POST /api/blogs/bulk ─ bulk actions
export const bulkAction = asyncHandler(async (req, res) => {
  const { action, ids } = req.body;
  if (!ids?.length) throw new AppError("No blog IDs provided", 400);

  let result;
  switch (action) {
    case "publish":
      result = await Blog.updateMany({ _id: { $in: ids } }, { status: "published" });
      break;
    case "draft":
      result = await Blog.updateMany({ _id: { $in: ids } }, { status: "draft" });
      break;
    case "delete":
      result = await Blog.deleteMany({ _id: { $in: ids } });
      break;
    default:
      throw new AppError("Invalid bulk action", 400);
  }

  res.json({ success: true, message: `Bulk ${action} completed`, affected: result.modifiedCount || result.deletedCount });
});
