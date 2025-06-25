## Hey, Notable Team! 👋

(Please note this project is still VERY much a work in progress, but gives a good idea of the direction I am headed in)

### 🏗️ Frontend Architecture Overview

This frontend follows a **layered architecture** with clear separation of concerns:

**First Level - Presentation Layer:**
- **Pages** (`/src/pages/`) - Top-level route components and page layouts
- **Components** (`/src/components/`) - Reusable UI components organized by domain

**Second Level - Business Logic Layer:**
- **Composables** (`/src/composables/`) - (Similar to React Hooks)


**Third Level - Service Layer:**
- **Services** (`/src/services/`) - API communication layer handling HTTP requests to backend

**Fourth Level - State Management Layer:**
    - **Stores** (`/src/stores/`) - Pinia stores for managing application state


### 🔧 Technology Stack
- **Vue 3** 
- **TypeScript**: Full type safety throughout the application
- **Pinia**: State management with TypeScript support
- **Vue Router**: Client-side routing with protected routes
- **Tailwind CSS**: Utility-first CSS framework to support light/dark mode
- **Vite**: Fast build tool and development server

