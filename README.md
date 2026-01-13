# CHAK Dosimetry Inventory Management System

A comprehensive inventory management system for tracking dosimeters, lead spectacles, hospital machines, and accessories for the Christian Health Association of Kenya (CHAK).

## 🚀 Features

### Core Functionality
- **Inventory Management**: Track and manage multiple item categories (dosimeters, spectacles, machines, accessories)
- **Category-Based Filtering**: Switch between different inventory types seamlessly
- **Real-time Notifications**: Automatic notifications for dispatch, receive, and system events
- **User Management**: Role-based access control (Admin/Hospital)
- **Shipment Tracking**: Track dosimeters from dispatch to delivery
- **Request Management**: Handle hospital requests with approval workflow
- **Contract Management**: Manage contracts and allocations
- **Dashboard Analytics**: Visual insights into inventory status and trends
- **History Tracking**: Complete audit trail for all inventory changes

### Technical Features
- **Modern UI/UX**: Built with Next.js 15, React 19, and Tailwind CSS
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Database**: MySQL with connection pooling
- **Authentication**: JWT-based secure authentication
- **API-First**: RESTful API architecture
- **Type Safety**: Full TypeScript support

## 📋 Prerequisites

- Node.js 18+ and npm
- MySQL 8.0+
- Git

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chak-dosimetry-ts
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   DB_HOST=your_database_host
   DB_USER=your_database_user
   DB_PASSWORD=your_database_password
   DB_NAME=chak_dosimetry
   JWT_SECRET=your_jwt_secret_key
   API_BASE_URL=http://localhost:4488
   ```

4. **Initialize the database**
   The database tables will be automatically created on first run. Ensure your MySQL server is running and accessible.

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   Open [http://localhost:4488](http://localhost:4488) in your browser

## 📖 Usage Guide

### Getting Started

1. **Login**: Use your credentials to access the system
   - Admin users have full access to all features
   - Hospital users have access to their specific hospital's data

2. **Dashboard**: View overview statistics and recent activity
   - Total inventory counts
   - Pending requests
   - Recent shipments
   - Expiring items alerts

### Inventory Management

#### Adding Items

1. Navigate to **Inventory** from the main menu
2. Select the appropriate category tab (Dosimeters, Spectacles, Machines, or Accessories)
3. Click **Add [Category]** button
4. Fill in the required information:
   - **Serial Number** (required, unique)
   - **Model** (optional)
   - **Type** (optional, used for filtering)
   - **Status** (defaults to "available")
   - **Calibration Date** (for dosimeters)
   - **Expiry Date** (for items with expiration)
   - **Hospital/Organization** (if assigning immediately)
   - **Contact Information** (if assigning)
   - **Comments** (any additional notes)

5. Click **Save** to add the item

#### Bulk Upload

1. Click **Add [Category]** button
2. Switch to **Bulk Upload** tab
3. Upload an Excel (.xlsx, .xls), CSV, or Word (.docx) file
4. Ensure your file has columns: `serial_number`, `status` (required)
5. Optional columns: `model`, `type`, `hospital_name`, `calibration_date`, `expiry_date`, etc.

#### Editing Items

1. Find the item in the inventory list
2. Click **Edit** button
3. Modify the fields as needed
4. Click **Save Changes**

#### Filtering and Searching

- **Search Bar**: Search by serial number, model, type, or hospital name
- **Status Filter**: Filter by status (available, dispatched, received, expired, etc.)
- **Hospital Filter**: Filter by assigned hospital
- **Category Tabs**: Switch between different item categories

#### Viewing History

1. Click **History** button on any item
2. View complete audit trail of all changes
3. See who made changes and when

### Dispatch Management

1. Navigate to **Dispatch** page
2. Select available items from inventory
3. Fill in shipment details:
   - Destination hospital
   - Contact person and phone
   - Courier information
   - Accessories included (device, case, pin holder, strap clip)
4. Click **Dispatch** to create shipment

### Receiving Items

1. Navigate to **Receive** page
2. Select items to receive
3. Fill in receiving details:
   - Received by (name and title)
   - Condition notes
4. Click **Receive** to update status

### Notifications

1. Navigate to **Notifications** page
2. View all system notifications
3. Filter by:
   - **All**: All notifications
   - **Unread**: Only unread notifications
4. Actions available:
   - Mark as read/unread
   - Delete individual notifications
   - Mark all as read
   - Delete all read notifications

### Settings (Admin Only)

1. Navigate to **Settings** page
2. Configure inventory categories:
   - Enable/disable categories
   - Categories control what appears in the inventory page
3. View system information
4. Click **Save Settings** to persist changes

### Profile Management

1. Navigate to **Profile** page
2. Update email address
3. Change password:
   - Enter current password
   - Enter new password (minimum 8 characters)
   - Confirm new password
4. View account information:
   - Role
   - Associated hospital (if applicable)
   - Member since date
5. Click **Save Changes** to update

## 🔧 Adding New Item Categories

The system is designed to be extensible. To add a new item category:

### Step 1: Update Database Schema

The system uses a unified `dosimeters` table. To add a new category:

1. Items are stored in the `dosimeters` table with a `type` column
2. The `type` column stores the category identifier (e.g., "spectacles", "machine", "accessory")
3. No database schema changes needed - just use the `type` field

### Step 2: Update Frontend Configuration

1. **Update Inventory Page** (`app/inventory/page.tsx`):
   ```typescript
   const categories = [
     { key: "dosimeter", label: "All Dosimetry Items", icon: Package },
     { key: "spectacles", label: "Lead Spectacles", icon: Glasses },
     { key: "machine", label: "Machines", icon: Computer },
     { key: "accessory", label: "Accessories", icon: Box },
     { key: "your_new_category", label: "Your New Category", icon: YourIcon }, // Add here
   ];
   ```

2. **Update Settings Page** (`app/settings/page.tsx`):
   ```typescript
   const DEFAULT_CATEGORIES: CategoryConfig[] = [
     { key: "dosimeter", label: "Dosimeters", enabled: true },
     { key: "spectacles", label: "Lead Spectacles", enabled: true },
     { key: "machine", label: "Hospital Machines", enabled: true },
     { key: "accessory", label: "Accessories & Holders", enabled: true },
     { key: "your_new_category", label: "Your New Category", enabled: true }, // Add here
   ];
   ```

3. **Import Required Icon** (if using a new icon):
   ```typescript
   import { YourIcon } from "lucide-react";
   ```

### Step 3: API Configuration

The inventory API (`app/api/inventory/route.ts`) automatically handles filtering by `type`. When you:
- Add items with `type: "your_new_category"`, they'll appear when that category tab is selected
- The API filters by `LOWER(type) = category` for non-default categories

### Step 4: Testing

1. Add a test item with `type: "your_new_category"`
2. Navigate to Inventory page
3. Click on your new category tab
4. Verify the item appears correctly
5. Test CRUD operations (add, edit, delete)

### Example: Adding "Protective Equipment" Category

```typescript
// 1. In app/inventory/page.tsx
import { Shield } from "lucide-react";

const categories = [
  // ... existing categories
  { key: "protective_equipment", label: "Protective Equipment", icon: Shield },
];

// 2. In app/settings/page.tsx
const DEFAULT_CATEGORIES: CategoryConfig[] = [
  // ... existing categories
  { key: "protective_equipment", label: "Protective Equipment", enabled: true },
];

// 3. When adding items, set type:
{
  serial_number: "PE-001",
  type: "protective_equipment",
  model: "Safety Goggles",
  status: "available"
}
```

## 🗄️ Database Schema

### Main Tables

- **dosimeters**: Unified inventory table storing all item types
- **notifications**: System notifications
- **shipments**: Shipment tracking
- **shipment_dosimeters**: Junction table linking shipments to items
- **requests**: Hospital requests
- **contracts**: Contract management
- **users**: User accounts
- **hospitals**: Hospital information
- **item_history**: Audit trail for all inventory changes
- **system_settings**: System configuration

### Key Fields

**dosimeters table:**
- `id`: Primary key
- `serial_number`: Unique identifier
- `type`: Category identifier (dosimeter, spectacles, machine, accessory)
- `status`: Current status (available, dispatched, received, expired, etc.)
- `hospital_name`: Assigned hospital
- `calibration_date`: Calibration date (for dosimeters)
- `expiry_date`: Expiration date
- `dispatched_at`: Dispatch timestamp
- `received_at`: Receive timestamp

## 🔐 Authentication & Authorization

- **JWT-based**: Secure token-based authentication
- **Role-based Access**: 
  - **ADMIN**: Full system access
  - **HOSPITAL**: Access to assigned hospital data only
- **Password Requirements**: Minimum 8 characters

## 📡 API Endpoints

### Inventory
- `GET /api/inventory?category=<category>` - Get inventory items
- `PATCH /api/inventory` - Add/update items
- `DELETE /api/inventory` - Delete items
- `GET /api/inventory/search` - Search inventory
- `GET /api/inventory/history?id=<id>` - Get item history

### Notifications
- `GET /api/notifications` - Get all notifications
- `POST /api/notifications` - Create notification
- `PATCH /api/notifications` - Update notification (mark as read)
- `DELETE /api/notifications` - Delete notification

### Settings
- `GET /api/settings` - Get system settings (Admin only)
- `PATCH /api/settings` - Update settings (Admin only)

### User Profile
- `GET /api/user/profile` - Get user profile
- `PATCH /api/user/profile` - Update profile

## 🎨 UI/UX Features

- **Modern Design**: Clean, professional interface
- **Responsive**: Works on all device sizes
- **Dark Mode Ready**: CSS variables support easy theming
- **Accessibility**: WCAG compliant focus states
- **Animations**: Smooth transitions using Framer Motion
- **Loading States**: Clear feedback during operations
- **Error Handling**: User-friendly error messages

## 🚀 Deployment

### Production Build

```bash
npm run build
npm start
```

### Using PM2

```bash
npm install -g pm2
pm2 start npm --name "chak-dosimetry" -- start
pm2 save
pm2 startup
```

### Environment Variables for Production

Ensure all environment variables are set:
- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET`
- `API_BASE_URL` (your production URL)

## 🐛 Troubleshooting

### Database Connection Issues
- Verify MySQL server is running
- Check database credentials in `.env.local`
- Ensure database exists: `CREATE DATABASE chak_dosimetry;`

### Notifications Not Showing
- Check browser console for errors
- Verify notifications table exists in database
- Check API endpoint: `GET /api/notifications`

### Items Not Appearing
- Verify `type` field matches category key exactly (case-sensitive)
- Check category filter is set correctly
- Ensure items exist in database with correct `type` value

### Authentication Issues
- Clear browser cookies
- Verify JWT_SECRET is set correctly
- Check token expiration

## 📝 Development

### Project Structure

```
chak-dosimetry-ts/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── inventory/         # Inventory page
│   ├── notifications/     # Notifications page
│   ├── profile/           # Profile page
│   └── settings/          # Settings page
├── components/             # React components
│   ├── UI/                # Reusable UI components
│   └── Layout/            # Layout components
├── lib/                    # Utility libraries
│   ├── database.ts        # Database connection
│   └── config.ts          # Configuration
└── types/                 # TypeScript types
```

### Code Style

- TypeScript strict mode enabled
- ESLint for code quality
- Prettier for formatting (recommended)

## 📄 License

[Your License Here]

## 👥 Contributors

[Your Team/Contributors]

## 📞 Support

For issues and questions, please contact [0718601536]

---

**Version**: 1.0.0  
**Last Updated**: 2025
