import mongoose from "mongoose";

// ── Content block sub-schema ──────────────────────────────────
const contentBlockSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["p", "h3", "ul", "ol", "callout", "callout-warn", "steps", "img"],
    required: true,
  },
  text: { type: String },             // p, h3, callout, callout-warn
  items: { type: [String] },          // ul, ol
  stepItems: [                        // steps
    {
      n: String,
      title: String,
      desc: String,
      tip: String,
    },
  ],
  src: { type: String },              // img block
  alt: { type: String },
}, { _id: false });

// ── Section sub-schema ───────────────────────────────────────
const sectionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  heading: { type: String, required: true },
  content: [contentBlockSchema],
}, { _id: false });

// ── TOC entry ────────────────────────────────────────────────
const tocSchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
}, { _id: false });

// ── Meta entry ───────────────────────────────────────────────
const metaSchema = new mongoose.Schema({
  label: { type: String, required: true },
  value: { type: String, required: true },
}, { _id: false });

// ── Related post ─────────────────────────────────────────────
const relatedSchema = new mongoose.Schema({
  img: String,
  tag: String,
  tagBg: String,
  tagColor: String,
  date: String,
  title: String,
  slug: { type: String, default: null },
}, { _id: false });

// ── Main Blog schema ─────────────────────────────────────────
const blogSchema = new mongoose.Schema(
  {
    // Core
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    excerpt: { type: String, required: true },
    tag: { type: String, required: true },
    tagStyle: {
      bg: { type: String, default: "#FEF3DC" },
      text: { type: String, default: "#9A5C06" },
    },

    // Dates & meta
    date: { type: String, required: true },           // "April 20, 2025"
    readTime: { type: String, default: "5 min read" },
    author: { type: String, default: "Compliance & Regulatory Team" },
    featured: { type: Boolean, default: false },
    status: { type: String, enum: ["draft", "published"], default: "draft" },

    // Images
    img: { type: String, required: true },            // listing card thumbnail
    heroImg: { type: String },                        // detail page hero
    heroGradient: { type: String, default: "linear-gradient(135deg,rgba(13,27,42,0.97) 0%,rgba(10,109,170,0.82) 100%)" },

    // SEO
    seo: {
      metaTitle: { type: String },
      metaDescription: { type: String },
      metaKeywords: { type: [String], default: [] },
      ogTitle: { type: String },
      ogDescription: { type: String },
      ogImage: { type: String },
      canonicalUrl: { type: String },
      structuredData: { type: String },               // JSON-LD string
      noIndex: { type: Boolean, default: false },
    },

    // Content
    highlights: { type: [String], default: [] },
    toc: [tocSchema],
    meta: [metaSchema],
    sections: [sectionSchema],
    tags: { type: [String], default: [] },

    // Sidebar
    sidebarCta: {
      title: String,
      body: String,
      btn: String,
    },

    // CTA band
    ctaTitle: { type: String },
    ctaBody: { type: String },

    // Related posts
    related: [relatedSchema],

    // Analytics
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Index for slug lookup
blogSchema.index({ slug: 1 });
blogSchema.index({ status: 1, createdAt: -1 });
blogSchema.index({ tag: 1 });
blogSchema.index({ featured: 1 });

export default mongoose.model("Blog", blogSchema);
