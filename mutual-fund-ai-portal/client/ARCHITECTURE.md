# Frontend Architecture - AI-Powered Mutual Fund Portal

## Overview

This document outlines the complete frontend architecture for the AI-powered Mutual Fund Advisory and Tracking Portal. The implementation follows React 19 best practices, uses React Router v7, and includes full Role-Based Access Control (RBAC).

---

## Architecture Components

### 1. Global State Management (Zustand)

**File:** `src/store/useAuthStore.js`

Manages authentication state and user information across the application.

#### State Structure
```javascript
{
  user: { id, name, email, role, avatar } | null,
  isAuthenticated: boolean,
  role: 'investor' | 'advisor' | 'admin' | null,
  isLoading: boolean
}
```

#### Key Actions
- `mockLogin(role)` - Mock login for testing without backend
- `logout()` - Clear authentication state
- `setUser(user)` - Set user data (for backend integration)
- `setIsLoading(boolean)` - Manage loading state
- `hasRole(role)` - Check if user has specific role
- `hasAnyRole(roles)` - Check if user has any of specified roles

#### Usage Example
```javascript
import useAuthStore from '@/store/useAuthStore';

const { user, isAuthenticated, role } = useAuthStore();
useAuthStore.getState().mockLogin('admin');
useAuthStore.getState().logout();
```

---

### 2. Navigation Components

#### A. Sidebar Component (`src/components/layout/Sidebar.jsx`)

Responsive navigation sidebar with role-based links.

**Features:**
- Role-based navigation links
  - **Investor**: Dashboard, AI Advisory, Portfolio, SIPs, History
  - **Advisor**: CRM Dashboard, Client Portfolios, Approvals, Reports
  - **Admin**: Platform Analytics, KYC Management, Fund Master, Settings
- Mobile: Hidden by default, toggled via hamburger menu
- Desktop: Fixed to left side
- Dark mode support (Tailwind `dark:` classes)
- Active link highlighting
- lucide-react icons throughout

**Props:**
```javascript
{
  isOpen: boolean,      // Controls visibility on mobile
  onClose: function     // Handler to close sidebar on mobile
}
```

#### B. Navbar Component (`src/components/layout/Navbar.jsx`)

Fixed top navigation bar with controls and user menu.

**Features:**
- Hamburger menu icon (mobile only)
- Logo and branding
- Dark mode toggle button
- User profile dropdown with logout option
- Responsive design

**Props:**
```javascript
{
  onMenuToggle: function,        // Toggle sidebar on mobile
  isDarkMode: boolean,            // Current theme state
  onDarkModeToggle: function      // Toggle dark mode
}
```

---

### 3. Layout Wrapper

**File:** `src/layouts/DashboardLayout.jsx`

Main layout wrapper that combines Navbar, Sidebar, and content area.

**Responsibilities:**
- Render Navbar and Sidebar components
- Manage mobile sidebar open/close state
- Manage dark mode state (with localStorage persistence)
- Render Outlet for page content
- Handle responsive layout transitions

**Dark Mode:**
- Initialized from localStorage or system preference
- Saves preference to localStorage
- Applies/removes `dark` class on document root

---

### 4. Routing System

#### A. Protected Route Component (`src/routes/ProtectedRoute.jsx`)

Wrapper component for route protection.

```javascript
<ProtectedRoute requiredRole="admin">
  <AdminPage />
</ProtectedRoute>
```

**Features:**
- Checks if user is authenticated
- Redirects to `/login` if not authenticated
- Optionally enforces role-based access
- Redirects to `/unauthorized` if role doesn't match

#### B. Router Configuration (`src/routes/index.jsx`)

Complete router setup using React Router v7 `createBrowserRouter`.

**Route Structure:**
```
/                          → Landing page
/login                     → Login page
/register                  → Register page
/chatbot                   → Chatbot interface
/dashboard-area/           → Protected dashboard layout
├── dashboard              → Role-specific dashboard
├── ai-advisory            → Investor exclusive
├── portfolio              → Investor exclusive
├── sips                   → Investor exclusive
├── history                → Investor exclusive
├── crm-dashboard          → Advisor exclusive
├── client-portfolios      → Advisor exclusive
├── approvals              → Advisor exclusive
├── reports                → Advisor exclusive
├── analytics              → Admin exclusive
├── kyc-management         → Admin exclusive
├── fund-master            → Admin exclusive
└── settings               → Admin exclusive
```

---

## Role-Based Access Control (RBAC)

### Three User Roles

#### 1. **Investor**
- View personal investment portfolio
- Receive AI-powered advisory recommendations
- Manage SIPs (Systematic Investment Plans)
- View transaction history
- Access AI chat assistant

#### 2. **Advisor**
- Manage client portfolios and relationships (CRM)
- Review and approve client transactions
- Generate performance reports
- Track client metrics

#### 3. **Admin**
- Monitor platform analytics
- Manage KYC (Know Your Customer) documents
- Maintain fund master data
- Configure system settings

### Implementation

**In Navigation:**
```javascript
const navigationConfig = {
  investor: [ /* investor links */ ],
  advisor: [ /* advisor links */ ],
  admin: [ /* admin links */ ],
};
```

**In Routes:**
```javascript
<ProtectedRoute requiredRole="admin">
  <AdminPage />
</ProtectedRoute>
```

---

## Styling & Design System

### Tailwind CSS

- **Dark Mode:** Configured with `dark:` classes
- **Responsive:** Mobile-first approach
- **Colors:** Blue primary (`bg-blue-600`), gray neutral palette
- **Spacing:** Consistent padding/margin using Tailwind scale

### Icons

- **Library:** lucide-react
- **Usage:** All navigation, UI controls, and data visualization
- **Size:** 20px standard, 24px for large elements

### Theme Support

```javascript
// Light mode (default)
<div className="bg-white text-gray-900">

// Dark mode
<div className="dark:bg-gray-900 dark:text-white">
```

---

## File Structure

```
src/
├── store/
│   └── useAuthStore.js                 # Zustand global state
│
├── components/
│   └── layout/
│       ├── Navbar.jsx                  # Top navigation bar
│       └── Sidebar.jsx                 # Left sidebar navigation
│
├── layouts/
│   └── DashboardLayout.jsx             # Main layout wrapper
│
├── routes/
│   ├── index.jsx                       # Router configuration
│   └── ProtectedRoute.jsx              # Route protection wrapper
│
├── pages/
│   ├── Landing.jsx                     # Public landing page
│   ├── Login.jsx                       # Public login page
│   ├── Register.jsx                    # Public registration page
│   ├── Chatbot.jsx                     # Chatbot interface
│   ├── investor/
│   │   └── Dashboard.jsx               # Investor dashboard
│   ├── advisor/
│   │   └── CRMDashboard.jsx            # Advisor CRM dashboard
│   └── admin/
│       └── Analytics.jsx               # Admin analytics dashboard
│
└── App.jsx                             # Main app entry point
```

---

## Setup & Usage

### Installation

Ensure dependencies are installed:

```bash
npm install zustand lucide-react react-router-dom
```

### Starting Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or similar).

---

## Testing the Implementation

### 1. Default State

Navigate to: `http://localhost:5173/dashboard-area/dashboard`

- Sidebar shows **Investor** links
- User badge displays "investor"
- Dashboard content loads

### 2. Role Switching (for testing)

Open browser console and run:

```javascript
// Switch to Advisor
useAuthStore.getState().mockLogin('advisor');

// Switch to Admin
useAuthStore.getState().mockLogin('admin');

// Return to Investor
useAuthStore.getState().mockLogin('investor');
```

Observe that sidebar navigation links change based on role.

### 3. Mobile Responsiveness

- Resize browser to < 1024px (Tailwind `lg` breakpoint)
- Hamburger menu should appear
- Click to toggle sidebar
- Sidebar overlays with backdrop
- Content remains readable

### 4. Dark Mode Toggle

- Click moon/sun icon in navbar
- Theme should toggle
- Preference persists on page reload
- All components support both light and dark modes

### 5. Protected Routes

- Logout: `useAuthStore.getState().logout()`
- Try accessing `/dashboard-area/dashboard`
- Should redirect to `/login` (ProtectedRoute redirects unauthenticated users)

### 6. Role-Based Route Protection

```javascript
// Login as Investor
useAuthStore.getState().mockLogin('investor');

// Navigate to Admin route (should not appear in sidebar)
// Try direct URL: /dashboard-area/analytics
// Should redirect to /unauthorized (ProtectedRoute blocks role mismatch)
```

---

## Integration with Backend

When backend API is ready, update `useAuthStore.js`:

```javascript
// Replace mockLogin with API call
setUser: async (credentials) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
  const data = await response.json();
  set({
    user: data.user,
    isAuthenticated: true,
    role: data.user.role
  });
  localStorage.setItem('token', data.token);
},

logout: async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  set({ user: null, isAuthenticated: false, role: null });
  localStorage.removeItem('token');
}
```

---

## Best Practices Implemented

✅ **Component Organization**
- Single Responsibility Principle
- Presentational vs Container components
- Reusable utility components

✅ **State Management**
- Centralized auth state with Zustand
- Minimal prop drilling
- Easy testing with mock methods

✅ **Routing**
- Modern React Router v7 approach
- Protected routes pattern
- Role-based access control
- Clear route structure

✅ **Styling**
- Utility-first CSS (Tailwind)
- Dark mode support built-in
- Responsive design mobile-first
- Consistent design tokens

✅ **Performance**
- Code splitting via routes
- Lazy loading ready
- No unnecessary re-renders
- Optimized icons (lucide-react)

✅ **Accessibility**
- Semantic HTML
- Proper heading hierarchy
- Icon labels and aria-labels (add as needed)
- Keyboard navigation support

---

## Common Tasks

### Add New Navigation Link

Edit `src/components/layout/Sidebar.jsx`:

```javascript
const navigationConfig = {
  investor: [
    // ... existing
    { label: 'New Page', path: '/dashboard-area/new-page', icon: NewIcon },
  ],
};
```

### Create New Role

1. Add role to auth store state
2. Add navigation config in Sidebar
3. Create page component
4. Add route in `src/routes/index.jsx`
5. Wrap route with ProtectedRoute if needed

### Add Protected Feature

```javascript
import ProtectedRoute from '@/routes/ProtectedRoute';

<ProtectedRoute requiredRole="admin">
  <AdminFeature />
</ProtectedRoute>
```

### Customize Styling

Edit Tailwind classes in components. Common patterns:

```javascript
// Dark mode
className="bg-white dark:bg-gray-900"

// Responsive
className="md:text-lg lg:text-xl"

// Hover states
className="hover:bg-gray-100 dark:hover:bg-gray-800"
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Routes not working | Ensure React Router is imported, check path syntax |
| Dark mode not persisting | Verify localStorage is enabled in browser |
| Sidebar not showing on desktop | Check Tailwind config includes `lg:` breakpoint |
| useAuthStore not found | Verify zustand is installed and imported correctly |
| Protected routes always redirect | Use `mockLogin()` to set authenticated state |
| Icons not showing | Confirm lucide-react is installed and imported |

---

## Next Steps

1. **Create Dashboard Pages** - Replace placeholder components with actual content
2. **Backend Integration** - Connect to authentication API
3. **Data Fetching** - Integrate with mutual funds API
4. **Error Boundaries** - Add error handling and fallback UI
5. **Loading States** - Implement skeleton loaders
6. **Form Validation** - Add form handling and validation
7. **Analytics** - Integrate analytics tracking
8. **Testing** - Add unit and integration tests

---

## Support

For issues or questions about the architecture, refer to:
- [React Router Documentation](https://reactrouter.com/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [lucide-react Icons](https://lucide.dev/)
