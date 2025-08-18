"use strict";
// =============================================================================
// SHARED TYPES - AI Presentation Builder
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONTENT_TYPES = exports.LAYOUT_TYPES = exports.TEMPLATE_CATEGORIES = exports.EXPORT_STATUSES = exports.EXPORT_FORMATS = exports.PRESENTATION_STATUSES = exports.SUBSCRIPTION_TIERS = void 0;
// =============================================================================
// ENUM-LIKE CONSTANTS
// =============================================================================
exports.SUBSCRIPTION_TIERS = ['free', 'premium', 'enterprise'];
exports.PRESENTATION_STATUSES = ['draft', 'ready', 'exported'];
exports.EXPORT_FORMATS = ['pptx', 'pdf', 'html', 'png', 'jpg'];
exports.EXPORT_STATUSES = ['pending', 'processing', 'completed', 'failed', 'cancelled'];
exports.TEMPLATE_CATEGORIES = ['business', 'education', 'creative', 'marketing', 'startup', 'corporate'];
exports.LAYOUT_TYPES = ['title', 'content', 'two-column', 'comparison', 'process', 'conclusion', 'custom'];
exports.CONTENT_TYPES = ['business_pitch', 'educational', 'marketing', 'report', 'portfolio', 'other'];
//# sourceMappingURL=index.js.map