# JSON Editor Application

## Overview

This is a full-stack JSON editor application built with React and Express. It provides a visual interface for editing JSON files with both structured form-based editing and raw text editing capabilities. The application features a file management system that allows users to browse, load, edit, and save JSON files stored on the server's filesystem.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Shadcn/ui component library built on top of Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Type Safety**: TypeScript throughout the entire application
- **API Design**: RESTful API with structured endpoints for file operations
- **File Storage**: Filesystem-based storage with automatic backup creation
- **Validation**: Zod schemas for request/response validation shared between client and server

### Data Storage Solutions
- **Primary Storage**: Local filesystem storage in `jsonapi/public/data` directory
- **Backup System**: Automatic backup creation in `jsonapi/public/data/backup` directory
- **Database**: Drizzle ORM configured for PostgreSQL (using Neon Database)
- **Schema Management**: Drizzle migrations with schema defined in `shared/schema.ts`

### Core Features
- **JSON Editing**: Dual-mode editing with visual form-based editor and raw text editor
- **File Management**: List, load, save, and validate JSON files
- **Real-time Validation**: Client-side JSON validation with error reporting
- **Backup System**: Automatic backup creation on file saves
- **Responsive Design**: Mobile-friendly interface with collapsible sidebar

### Development Workflow
- **Build System**: Vite for development and production builds
- **Development Server**: Express server with Vite middleware for HMR
- **Type Checking**: Shared TypeScript configuration across client and server
- **Code Quality**: ESBuild for production bundling

## External Dependencies

### Database Services
- **Neon Database**: PostgreSQL-compatible serverless database (@neondatabase/serverless)
- **Drizzle ORM**: Type-safe database operations with migration support

### UI Framework
- **Radix UI**: Comprehensive set of low-level UI primitives for accessibility
- **Shadcn/ui**: Pre-built component library with consistent design system
- **Tailwind CSS**: Utility-first CSS framework for styling

### State Management
- **TanStack Query**: Server state management with caching, background updates, and optimistic updates
- **React Hook Form**: Performant form library with built-in validation

### Development Tools
- **Vite**: Fast build tool with HMR and optimized production builds
- **TypeScript**: Type safety across the entire application stack
- **Zod**: Runtime type validation and schema definition

### Additional Libraries
- **Wouter**: Lightweight routing library for React
- **date-fns**: Date manipulation and formatting utilities
- **class-variance-authority**: Utility for creating variant-based component APIs
- **Embla Carousel**: Carousel component for UI interactions