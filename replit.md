# Business Directory Application

## Overview

This is a Next.js 14 static business directory application that generates individual landing pages for businesses based on their industry templates. The application uses App Router architecture with static site generation to create SEO-optimized pages for plumbing and HVAC businesses. Each business gets a dedicated page at `/{template_key}/{slug}` routes with customized branding and contact information.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: Next.js 14 with App Router for modern React development
- **Styling**: Tailwind CSS with custom CSS variables for dynamic theming
- **TypeScript**: Full TypeScript implementation for type safety
- **Static Generation**: Uses `generateStaticParams()` for pre-rendering all business pages at build time
- **Routing**: Dynamic nested routes at `app/[template]/[slug]/page.tsx` for individual business pages

### Data Management
- **Data Source**: CSV file (`data/businesses.csv`) containing business information
- **Data Loading**: Custom utility functions in `lib/loadBiz.ts` for parsing and serving business data
- **Type System**: Strongly typed business interface in `types/business.ts` with proper field types

### Template System
- **Template-based Rendering**: Separate React components for different business types
- **Industry Templates**: 
  - `plumbing_t1.tsx` for plumbing businesses
  - `hvac_t1.tsx` for HVAC businesses
- **Dynamic Theming**: CSS custom properties set per business using primary/secondary colors from data
- **Conditional Logic**: Smart email display based on validation status

### Configuration
- **Static Export**: Configured for static site generation with `output: 'export'`
- **Image Optimization**: Disabled for static deployment compatibility
- **Path Aliases**: TypeScript path mapping with `@/*` for clean imports
- **PostCSS Pipeline**: Tailwind CSS processing with autoprefixer

### Business Page Features
- **Header**: Dynamic logo or text-based branding with call-to-action
- **Hero Section**: Business information with ratings and contact details
- **Services**: Industry-specific service listings with icons and descriptions
- **Reviews**: Placeholder customer testimonials with link to external reviews
- **Contact**: Complete contact information with social media integration

## External Dependencies

### Core Framework
- **Next.js 15.5.0**: React framework for production applications
- **React 19.1.1**: UI library with latest features
- **TypeScript 5.9.2**: Static type checking and enhanced developer experience

### Styling and UI
- **Tailwind CSS 4.1.12**: Utility-first CSS framework
- **PostCSS 8.5.6**: CSS post-processing tool
- **Autoprefixer 10.4.21**: CSS vendor prefix automation

### Development Tools
- **@types packages**: Type definitions for Node.js, React, and React DOM
- **Sharp**: Image optimization library (optional dependency)

### Integrations
- **Google Maps**: Embedded maps for business locations (via iframe)
- **Google Reviews**: External review system linking
- **Social Media**: Facebook and Instagram profile linking