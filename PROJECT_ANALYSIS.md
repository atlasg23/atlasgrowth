# CRM + Business Template System - Project Analysis & Implementation Plan

## Executive Summary
This project is a hybrid CRM/lead management system with dynamic business website templates. It pulls business data from Outscraper, manages contacts through a custom dashboard, and generates personalized business websites for outreach campaigns. The system currently has 7 industry-specific templates and integrates with GoHighLevel (GHL) for pipeline management.

## Current State Analysis

### Architecture Overview
- **Frontend**: Next.js 15.5 with TypeScript, React 19, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: Supabase (PostgreSQL with RLS)
- **Templates**: 7 niches (Plumbing, HVAC, Fire Protection, Pest Control, Pressure Washing, Roofing, Tree Service)
- **Data Source**: Outscraper for business data
- **Deployment**: Currently on Replit, planning Vercel migration

### Core Features (Working)
1. **Lead Management Dashboard** (`/dashboard/contacts`)
   - Filtering by business type, ratings, reviews, email validity, etc.
   - Pagination (50 leads per page)
   - Business detail tabs with comprehensive info
   
2. **Dynamic Template System** (`/[template]/[slug]`)
   - URL-based routing using business slug from Supabase
   - Template selection based on business type
   - Basic business information display

3. **Google Reviews Integration** 
   - Apify API integration for fetching reviews
   - Storage in `google_reviews` table
   - Manual fetch button in dashboard

4. **Basic Tracking** (`/api/track-view`)
   - Records template views with IP tracking
   - Unique visitor detection (1-hour window)
   - Webhook to GHL on view (partially working)

### Current Issues & Limitations

#### 1. Tracking System (BROKEN/INCOMPLETE)
- **Problem**: Current tracking is fragmented and unreliable
- **Issues**:
  - No session persistence across pages
  - Limited engagement metrics (only page views)
  - GHL webhook integration is one-way only
  - No time-on-site tracking
  - Missing scroll depth/interaction tracking
  - No link click tracking

#### 2. Template Customization (LIMITED)
- **Problem**: Only one template has image editing capability
- **Issues**:
  - No color scheme customization
  - Can't update business hours dynamically
  - No logo upload/replacement
  - Static content sections

#### 3. GHL Integration (BASIC)
- **Problem**: Limited bidirectional communication
- **Current State**:
  - Only sends view notifications
  - No pipeline stage updates
  - No automatic contact creation
  - Missing template sent confirmations

#### 4. Review Display (STATIC)
- **Problem**: Templates show generic reviews, not business-specific
- **Issues**:
  - Reviews fetched but not displayed on templates
  - No automatic pre-fetching before calls
  - No review response handling

## Proposed Solutions & Implementation Plan

### Phase 1: Fix Critical Tracking Infrastructure (Week 1)

#### 1.1 Comprehensive Tracking System
```typescript
// New tracking events to implement:
- page_view (enhanced with duration)
- template_sent (when link shared)
- email_opened (if sent via email)
- link_clicked (track all CTAs)
- scroll_depth (25%, 50%, 75%, 100%)
- time_on_page (heartbeat every 30s)
- form_interaction (if forms added)
```

**Implementation Steps:**
1. Create unified tracking script with session management
2. Implement event queue for batch sending
3. Add tracking pixels for email opens
4. Create dashboard analytics view
5. Set up real-time webhook notifications to GHL

#### 1.2 Session Management
```javascript
// Generate persistent session ID
- Use localStorage for session persistence
- Track session duration and page flow
- Link all events to session
- Handle cross-domain tracking for custom domains
```

### Phase 2: GoHighLevel Bidirectional Integration (Week 1-2)

#### 2.1 Webhook Architecture
```
Your App <-> GHL Flow:
1. Contact Research (Your Dashboard)
2. Create/Update Contact in GHL (webhook)
3. Pipeline Stage: "Researched"
4. Generate & Send Template
5. Pipeline Stage: "Template Sent" (webhook to GHL)
6. Track View → Update to "Template Viewed"
7. GHL sends updates back (pipeline changes, notes, etc.)
```

#### 2.2 Implementation
1. **Outbound Webhooks** (Your App → GHL):
   - Contact created/updated
   - Template sent
   - Template viewed
   - Engagement metrics

2. **Inbound Webhooks** (GHL → Your App):
   - Pipeline stage changes
   - Contact updates
   - Task completions
   - Notes added

3. **Data Sync**:
   - Add `ghl_contact_id` to leads table
   - Create `ghl_sync_log` table for audit trail
   - Implement retry mechanism for failed webhooks

### Phase 3: Dynamic Review Integration (Week 2)

#### 3.1 Review Pre-fetching System
```typescript
// Automated review fetching workflow:
1. When lead enters "Research" stage
2. Check if place_id exists
3. Fetch reviews via Apify API
4. Store in google_reviews table
5. Flag lead as "reviews_fetched"
6. Display on template dynamically
```

#### 3.2 Template Integration
1. Create ReviewSection component
2. Replace static reviews with dynamic data
3. Add review statistics (average, distribution)
4. Implement review response display
5. Add social proof indicators

### Phase 4: Template Customization System (Week 2-3)

#### 4.1 Customization Features
```typescript
interface TemplateCustomization {
  // Colors
  primaryColor: string
  secondaryColor: string
  accentColor: string
  
  // Images
  logo: File | string
  heroImage: File | string
  galleryImages: File[] | string[]
  
  // Content
  businessHours: BusinessHours
  services: Service[]
  teamMembers: TeamMember[]
  
  // CTAs
  primaryCTA: string
  secondaryCTA: string
  ctaLinks: CTALink[]
}
```

#### 4.2 Implementation
1. Create customization UI in dashboard
2. Store customizations in `template_customizations` table
3. Apply customizations via CSS variables
4. Image upload to Supabase storage
5. Preview mode for changes

### Phase 5: Custom Domain Middleware (Week 3)

#### 5.1 Domain Architecture
```
Options:
1. Vercel Edge Functions (Recommended)
   - Multi-tenant architecture
   - Wildcard SSL certificates
   - Edge middleware for routing

2. Cloudflare Workers + Pages
   - Lower cost at scale
   - Better DDoS protection
   - Requires DNS management

3. Custom Nginx Proxy
   - Full control
   - Higher maintenance
   - Need dedicated server
```

#### 5.2 Implementation (Vercel Approach)
1. Set up wildcard domain (`*.yourdomain.com`)
2. Create middleware for domain routing
3. Store domain mappings in database
4. Implement SSL provisioning
5. Add domain management UI

### Phase 6: Vercel Deployment & Production Setup (Week 3-4)

#### 6.1 Migration Steps
1. Set up Vercel project
2. Configure environment variables
3. Set up GitHub integration
4. Configure build settings
5. Set up custom domains
6. Implement preview deployments

#### 6.2 Performance Optimizations
1. Image optimization with next/image
2. Static generation for templates
3. Edge caching for API routes
4. Database connection pooling
5. CDN for static assets

## Database Schema Updates

```sql
-- Tracking enhancements
CREATE TABLE template_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  business_slug TEXT NOT NULL,
  started_at TIMESTAMP DEFAULT NOW(),
  last_activity TIMESTAMP DEFAULT NOW(),
  total_duration INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 1,
  max_scroll_depth INTEGER DEFAULT 0,
  links_clicked JSONB DEFAULT '[]',
  device_info JSONB,
  location_info JSONB
);

CREATE TABLE tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT REFERENCES template_sessions(session_id),
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- GHL Integration
ALTER TABLE leads ADD COLUMN ghl_contact_id TEXT;
ALTER TABLE leads ADD COLUMN ghl_pipeline_stage TEXT;
ALTER TABLE leads ADD COLUMN ghl_last_sync TIMESTAMP;
ALTER TABLE leads ADD COLUMN reviews_fetched BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN reviews_fetched_at TIMESTAMP;

CREATE TABLE ghl_webhook_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  direction TEXT NOT NULL, -- 'inbound' or 'outbound'
  webhook_type TEXT NOT NULL,
  payload JSONB,
  response_status INTEGER,
  response_body TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Template customizations
CREATE TABLE template_customizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_slug TEXT UNIQUE NOT NULL,
  template_type TEXT NOT NULL,
  customizations JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Custom domains
CREATE TABLE custom_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT UNIQUE NOT NULL,
  business_slug TEXT NOT NULL,
  ssl_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  verified_at TIMESTAMP
);
```

## Technology Stack Recommendations

### Keep/Enhance
- Next.js 15 (excellent choice for this use case)
- Supabase (good for rapid development)
- Tailwind CSS (maintain consistency)

### Add
- **Analytics**: Mixpanel or PostHog for detailed tracking
- **Email**: SendGrid or Resend for transactional emails
- **CDN**: Cloudflare for assets and protection
- **Monitoring**: Sentry for error tracking
- **Queue**: Upstash or BullMQ for background jobs

### Consider
- **CMS**: Strapi or Payload for content management
- **A/B Testing**: GrowthBook or Split.io
- **Chat**: Intercom or Crisp for live chat on templates

## Cost Analysis

### Current Costs (Estimated)
- Replit: ~$20/month
- Supabase: Free tier (likely need upgrade soon)
- Apify: ~$50/month for reviews
- Outscraper: Variable based on usage

### Projected Costs (Production)
- Vercel: $20-100/month (Pro plan recommended)
- Supabase: $25-50/month (Pro plan)
- Cloudflare: $20/month (Pro plan)
- SendGrid: $20/month (starter)
- **Total**: ~$135-240/month

## Risk Mitigation

### Technical Risks
1. **Scaling Issues**: Implement caching and CDN early
2. **Data Loss**: Regular backups, implement soft deletes
3. **Security**: Implement rate limiting, CORS, CSP headers
4. **Performance**: Monitor Core Web Vitals, optimize images

### Business Risks
1. **Compliance**: Ensure GDPR/CCPA compliance for tracking
2. **Deliverability**: Warm up IPs for email sending
3. **Abuse**: Implement usage limits and monitoring

## Priority Action Items

### Immediate (This Week)
1. Fix tracking system with proper session management
2. Implement bidirectional GHL webhooks
3. Set up error monitoring (Sentry)
4. Create backup strategy

### Short-term (Next 2 Weeks)
1. Integrate dynamic reviews into templates
2. Build template customization UI
3. Migrate to Vercel
4. Implement analytics dashboard

### Medium-term (Month 1-2)
1. Custom domain system
2. Email campaign features
3. A/B testing framework
4. Advanced analytics

## Questions for Clarification

1. **GHL Pipeline Structure**: What are your exact pipeline stages? Need to map these properly.

2. **Template Customization Depth**: How much control do you want users to have? Full HTML editing or just predefined options?

3. **Pricing Model**: Will clients pay for custom domains? One-time or recurring?

4. **Email Integration**: Do you want to send templates via email directly, or just SMS/calls?

5. **Review Management**: Should negative reviews be filtered? How to handle review responses?

6. **Multi-user Access**: Will you have team members? Need roles/permissions?

7. **White-labeling**: Should templates be completely brandable for agencies?

8. **Backup CRM**: Is GHL the primary CRM, or should this system be standalone-capable?

## Next Steps

1. **Review this document** and provide feedback on priorities
2. **Answer clarification questions** to refine implementation
3. **Choose deployment timeline** (aggressive 3-week vs comfortable 6-week)
4. **Decide on Phase 1 features** to implement tonight
5. **Set up Vercel project** if ready to migrate

## Recommended Starting Point for Tonight

Given the time constraints, I recommend:

1. **Fix tracking first** (2-3 hours)
   - Implement proper session management
   - Add engagement tracking
   - Fix GHL webhook

2. **Quick GHL integration** (1-2 hours)
   - Set up bidirectional webhooks
   - Add pipeline stage tracking
   - Test with your actual GHL account

3. **Review pre-fetching** (1 hour)
   - Add button to fetch all reviews for filtered leads
   - Update templates to show real reviews

This gives you immediate value and sets foundation for other features.

---

**Note**: This plan is modular - we can adjust priorities based on your immediate business needs. The tracking fix is critical and should be done first, as it affects your ability to measure ROI on outreach campaigns.