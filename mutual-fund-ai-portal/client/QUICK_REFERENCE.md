# Quick Reference - Frontend Architecture

## Files Created

### 1. Zustand Store
- **File**: `src/store/useAuthStore.js`
- **Purpose**: Global authentication state management
- **Mock Data**: Default investor user for testing

### 2. Navigation Components
- **Sidebar**: `src/components/layout/Sidebar.jsx` (role-based navigation)
- **Navbar**: `src/components/layout/Navbar.jsx` (top bar with controls)

### 3. Layout
- **File**: `src/layouts/DashboardLayout.jsx`
- **Purpose**: Wraps all authenticated pages with sidebar + navbar

### 4. Routing
- **Router Config**: `src/routes/index.jsx` (all routes with protection)
- **Protected Route**: `src/routes/ProtectedRoute.jsx` (route wrapper)

### 5. Page Components (Placeholders)
- `src/pages/investor/Dashboard.jsx` (investor dashboard)
- `src/pages/advisor/CRMDashboard.jsx` (advisor dashboard)
- `src/pages/admin/Analytics.jsx` (admin dashboard)

### 6. Entry Point
- **Updated**: `src/App.jsx` (now uses new router)

---

## Navigation Links by Role

### Investor Links
- Dashboard → `/dashboard-area/dashboard`
- AI Advisory → `/dashboard-area/ai-advisory`
- Portfolio → `/dashboard-area/portfolio`
- SIPs → `/dashboard-area/sips`
- History → `/dashboard-area/history`

### Advisor Links
- CRM Dashboard → `/dashboard-area/crm-dashboard`
- Client Portfolios → `/dashboard-area/client-portfolios`
- Approvals → `/dashboard-area/approvals`
- Reports → `/dashboard-area/reports`

### Admin Links
- Platform Analytics → `/dashboard-area/analytics`
- KYC Management → `/dashboard-area/kyc-management`
- Fund Master → `/dashboard-area/fund-master`
- Settings → `/dashboard-area/settings`

---

## Browser Console Commands for Testing

```javascript
// Import (if needed in console)
import useAuthStore from './store/useAuthStore'

// Login as specific role
useAuthStore.getState().mockLogin('investor')   // Investor
useAuthStore.getState().mockLogin('advisor')    // Advisor
useAuthStore.getState().mockLogin('admin')      // Admin

// Check current state
useAuthStore.getState()                          // Full state
useAuthStore.getState().isAuthenticated          // Auth status
useAuthStore.getState().role                     // Current role
useAuthStore.getState().user                     // User object

// Logout
useAuthStore.getState().logout()                 // Clear auth state
```

---

## Component Props Reference

### Sidebar
```javascript
<Sidebar 
  isOpen={boolean}              // Is sidebar visible on mobile
  onClose={function}            // Handler to close sidebar
/>
```

### Navbar
```javascript
<Navbar
  onMenuToggle={function}       // Toggle sidebar on mobile
  isDarkMode={boolean}          // Current theme state
  onDarkModeToggle={function}   // Toggle dark mode
/>
```

### ProtectedRoute
```javascript
<ProtectedRoute requiredRole="admin">
  {/* component */}
</ProtectedRoute>
```

---

## Zustand Store API

### State Properties
- `user` - User object with id, name, email, role, avatar
- `isAuthenticated` - Boolean flag
- `role` - Current user role ('investor', 'advisor', 'admin', or null)
- `isLoading` - Loading state boolean

### Actions
- `mockLogin(role)` - Mock login with role
- `logout()` - Clear auth state
- `setUser(user)` - Set user (for backend)
- `setIsLoading(bool)` - Set loading state
- `hasRole(role)` - Check if user has role
- `hasAnyRole(roles)` - Check if user has any of roles

---

## Design Tokens

### Colors
- **Primary**: Blue (`bg-blue-600`, `text-blue-600`)
- **Neutral**: Gray palette (`gray-50` to `gray-950`)
- **Success**: Green (`text-green-600`)
- **Warning**: Orange (`text-orange-500`)
- **Error**: Red (`text-red-600`)

### Spacing
- Standard: 4px increments (Tailwind scale)
- Large padding: `p-6` to `p-8`
- Gaps: `gap-3` to `gap-6`

### Sizing
- Sidebar width: `w-64` (256px)
- Navbar height: `h-16` (64px)
- Icons: `size-20` to `size-24` (20-24px)

### Dark Mode
```javascript
className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
```

---

## Responsive Breakpoints (Tailwind)

- **Mobile**: < 640px (default)
- **Tablet**: 640px+ (`sm:`)
- **Laptop**: 1024px+ (`lg:`)
- **Desktop**: 1280px+ (`xl:`)

```javascript
className="hidden lg:block"        // Show only on desktop
className="lg:ml-64"               // Add margin on desktop
className="pt-16 lg:pt-0"          // Padding adjustments
```

---

## Dark Mode Usage

### In Components
```javascript
className="bg-white dark:bg-gray-800 
           text-gray-900 dark:text-white"
```

### Toggle Function
Located in Navbar - click moon/sun icon to toggle

### Persistence
Saves to `localStorage` as `darkMode` key

---

## Path Reference

### Protected Routes (require authentication)
- All routes under `/dashboard-area/`

### Public Routes (no authentication needed)
- `/` - Landing page
- `/login` - Login page
- `/register` - Register page
- `/chatbot` - Chatbot interface

### Role-Restricted Routes (with ProtectedRoute wrapper)
- Check `src/routes/index.jsx` for role assignments

---

## Styling Patterns

### Active Link
```javascript
className={active 
  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 border-l-4 border-blue-600'
  : 'text-gray-700 hover:bg-gray-50'
}
```

### Button Hover
```javascript
className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
```

### Card/Container
```javascript
className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
```

---

## Performance Tips

1. **Icons**: lucide-react is tree-shakeable - only used icons are bundled
2. **Routes**: Lazy loading ready via React Router
3. **Store**: Zustand has minimal overhead
4. **Styling**: Tailwind purges unused classes in production

---

## Common Modifications

### Change Primary Color
Replace `blue-600` with desired color throughout:
- `src/components/layout/Navbar.jsx`
- `src/components/layout/Sidebar.jsx`
- `src/layouts/DashboardLayout.jsx`

### Add New Role
1. Update store in `useAuthStore.js`
2. Add navigation config in `Sidebar.jsx`
3. Create page component
4. Add routes in `src/routes/index.jsx`

### Disable Dark Mode
Remove dark mode toggle button and state management from Navbar/DashboardLayout

---

## Documentation Files

- **ARCHITECTURE.md** - Comprehensive architecture guide
- **TESTING_GUIDE.md** - Detailed testing instructions
- **QUICK_REFERENCE.md** - This file

---

## Next Actions

1. ✅ Verify all files are created
2. ⏳ Integrate with backend authentication API
3. ⏳ Replace placeholder pages with actual content
4. ⏳ Add error boundaries and loading states
5. ⏳ Create additional pages for each role
6. ⏳ Add unit and integration tests
7. ⏳ Deploy to production

---

## Support Resources

- React Router: https://reactrouter.com/
- Zustand: https://github.com/pmndrs/zustand
- Tailwind CSS: https://tailwindcss.com/
- lucide-react: https://lucide.dev/
- React 19: https://react.dev/

---

**Architecture Version**: 1.0
**Created**: 2026-04-30
**Status**: Ready for Backend Integration
