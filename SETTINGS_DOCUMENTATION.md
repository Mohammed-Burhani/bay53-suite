# Settings Module Documentation

## Overview
The Settings module provides a comprehensive configuration interface for the StockBuddy ERP application. It's designed to be accessible, internationalized, and covers all aspects of business operations.

## Access
Navigate to: `/settings` or click "Settings" in the sidebar navigation.

## Settings Categories

### 1. Business Settings
**Purpose**: Configure core business information and identity

**Features**:
- Business name, legal name, and contact details
- Tax identification (GSTIN, PAN)
- Complete address with state selection
- Business logo upload
- Industry classification
- Bank account details (Account number, IFSC, UPI)

**Use Cases**:
- Initial business setup
- Updating company information
- Managing payment details for invoices

---

### 2. Localization Settings
**Purpose**: Configure regional and international preferences

**Features**:
- **Language Support**: 16+ languages including:
  - English, Hindi, Marathi, Gujarati, Tamil, Telugu, Kannada, Malayalam, Bengali, Punjabi
  - Spanish, French, German, Arabic, Chinese, Japanese
- **Timezone**: Support for major global timezones
- **Date/Time Formats**: Multiple format options (DD-MM-YYYY, MM-DD-YYYY, etc.)
- **Currency Settings**:
  - 11+ currencies (INR, USD, EUR, GBP, AED, SAR, SGD, AUD, CAD, JPY, CNY)
  - Decimal places configuration
  - Number format (Indian vs International)
  - Currency symbol position
- **Fiscal Year**: Configurable start month and week start day

**Use Cases**:
- International business operations
- Multi-language support for diverse teams
- Regional compliance requirements

---

### 3. Invoice Settings
**Purpose**: Customize invoice generation and appearance

**Features**:
- **Invoice Numbering**:
  - Custom prefix configuration
  - Multiple format options
  - Number padding (2-5 digits)
  - Annual reset option
- **Invoice Display**:
  - Toggle company logo
  - Show/hide GSTIN, HSN codes
  - Item discount display
  - Bank details visibility
  - Terms & conditions
- **Templates**: 5 invoice templates (Standard, Modern, Classic, Minimal, Detailed)
- **Default Terms**: Customizable terms and conditions
- **Payment Settings**:
  - Default payment terms (Net 7, 15, 30, 45, 60, 90 days)
  - Default payment mode
  - Partial payment support

**Use Cases**:
- Professional invoice customization
- Compliance with regional requirements
- Brand consistency

---

### 4. Tax Settings
**Purpose**: Configure tax system and GST compliance

**Features**:
- **Tax System**: GST (India), VAT, Sales Tax, or No Tax
- **Tax Calculation**: Exclusive vs Inclusive
- **GST Configuration**:
  - Enable/disable GST
  - Reverse Charge Mechanism (RCM)
  - GST rate slabs (0%, 5%, 12%, 18%, 28%)
  - Custom rate addition
- **Inter-State/Intra-State**:
  - Auto-detect inter-state transactions
  - CGST/SGST split display
- **Tax Exemptions**:
  - Category-level exemptions
  - Customer-level exemptions
- **GST Filing**:
  - Filing frequency (Monthly, Quarterly, Annual)
  - GST portal integration
  - Auto-report generation

**Use Cases**:
- GST compliance for Indian businesses
- International tax configuration
- Tax exemption management

---

### 5. Print Settings
**Purpose**: Configure print layout and behavior

**Features**:
- **Paper Settings**:
  - Paper size (A4, A5, Letter, Legal, Thermal 80mm/58mm)
  - Orientation (Portrait/Landscape)
  - Custom margins
- **Print Options**:
  - Auto-print after save
  - Header/footer on every page
  - Background colors
  - Watermark support
  - Default number of copies
  - Print quality settings
- **Thermal Printer**:
  - Printer type selection
  - Font size configuration
  - Auto-cut paper
  - Cash drawer trigger

**Use Cases**:
- POS receipt printing
- Professional invoice printing
- Thermal printer integration

---

### 6. Notification Settings
**Purpose**: Configure alerts and notifications

**Features**:
- **Email Notifications**:
  - Low stock alerts
  - Payment reminders
  - Daily sales summary
  - New customer registration
  - Invoice status updates
- **SMS Notifications**:
  - SMS provider integration (Twilio, MSG91, TextLocal)
  - Invoice SMS to customers
  - Payment confirmations
  - Due date reminders
- **In-App Notifications**:
  - Desktop notifications
  - Sound alerts
  - Notification badges
  - Duration settings
- **Alert Thresholds**:
  - Low stock threshold
  - Payment reminder days
  - Overdue alert timing
  - High-value transaction alerts

**Use Cases**:
- Proactive inventory management
- Customer communication
- Payment collection

---

### 7. Security Settings
**Purpose**: Manage security and access control

**Features**:
- **Authentication**:
  - Two-factor authentication (2FA)
  - Password change requirements
  - Session timeout configuration
  - Password change interface
- **Access Control**:
  - IP whitelisting
  - Multiple login restrictions
  - Login attempt limits
  - Account lockout duration
- **Data Security**:
  - Data encryption
  - Automatic backups
  - Audit logging
  - Data anonymization
- **API Security**:
  - API access control
  - API key management
  - Key regeneration
- **Danger Zone**:
  - Data deletion
  - Account closure

**Use Cases**:
- Enterprise security compliance
- User access management
- Data protection

---

### 8. Appearance Settings
**Purpose**: Customize UI appearance and layout

**Features**:
- **Theme**:
  - Light/Dark/System mode
  - 8 color schemes (Blue, Green, Purple, Orange, Pink, Teal, Red, Indigo)
  - High contrast mode
- **Layout**:
  - Sidebar position (Left/Right)
  - Sidebar behavior (Expanded/Collapsed/Auto)
  - Compact mode
  - Breadcrumb visibility
- **Display**:
  - Font size (Small to Extra Large)
  - Font family selection
  - Content density (Compact/Comfortable/Spacious)
  - Animation reduction
  - Tooltip visibility
- **Dashboard Customization**:
  - Toggle sales chart
  - Recent transactions widget
  - Low stock alerts widget
  - Top products widget

**Use Cases**:
- Personalized user experience
- Accessibility improvements
- Performance optimization

---

### 9. User Management Settings
**Purpose**: Manage users, roles, and permissions

**Features**:
- **User Management**:
  - Add/edit/delete users
  - User status management
  - User activity log
- **Roles & Permissions**:
  - Administrator (Full access)
  - Manager (Limited access)
  - Cashier (Basic access)
  - Custom role creation
  - Granular permission control:
    - Manage Users
    - View Reports
    - Manage Inventory
    - Process Sales
    - Manage Settings
    - Delete Records
- **User Invitations**:
  - Email invitation system
  - Role assignment during invitation
- **Activity Log**:
  - Track user actions
  - Audit trail

**Use Cases**:
- Multi-user business operations
- Role-based access control
- Team management

---

### 10. Data Settings
**Purpose**: Manage data backup, import/export, and maintenance

**Features**:
- **Backup & Restore**:
  - Automatic backups (Hourly/Daily/Weekly/Monthly)
  - Cloud backup storage
  - Retention period configuration
  - Manual backup creation
  - Restore from backup
  - Recent backup history
- **Import & Export**:
  - Export products, customers, invoices, reports
  - Import products and customers
  - Multiple formats (CSV, Excel, JSON, PDF)
  - Include archived data option
- **Data Cleanup**:
  - Auto-delete old records
  - Archive completed transactions
  - Configurable retention period
  - Storage usage monitoring
- **Database Maintenance**:
  - Auto-optimize database
  - Vacuum database
  - Database statistics
  - Manual optimization
- **Danger Zone**:
  - Reset all data
  - Delete database

**Use Cases**:
- Data migration
- Regular backups
- Storage optimization
- Compliance with data retention policies

---

## Technical Implementation

### File Structure
```
app/(app)/settings/
  └── page.tsx                          # Main settings page with tabs

components/settings/
  ├── BusinessSettings.tsx              # Business information
  ├── LocalizationSettings.tsx          # Regional & currency settings
  ├── InvoiceSettings.tsx               # Invoice configuration
  ├── TaxSettings.tsx                   # Tax & GST settings
  ├── PrintSettings.tsx                 # Print layout & options
  ├── NotificationSettings.tsx          # Alerts & notifications
  ├── SecuritySettings.tsx              # Security & access control
  ├── AppearanceSettings.tsx            # UI customization
  ├── UserManagementSettings.tsx        # Users & permissions
  └── DataSettings.tsx                  # Backup & data management
```

### Navigation
Settings are accessible via:
1. Sidebar navigation → Settings → All Settings
2. Direct URL: `/settings`

### State Management
Settings should be integrated with:
- Supabase for persistent storage
- React Context/Zustand for client-side state
- Local storage for UI preferences

### Internationalization
All settings labels and descriptions should be:
- Translatable via i18n
- Support RTL languages (Arabic)
- Use appropriate number/date formats per locale

## Future Enhancements

1. **Integration Settings**: Third-party app integrations (Accounting software, Payment gateways)
2. **Workflow Automation**: Custom workflow rules and triggers
3. **Advanced Reporting**: Custom report builder settings
4. **Multi-location**: Branch/warehouse specific settings
5. **E-commerce**: Online store configuration
6. **Mobile App**: Mobile-specific settings
7. **Compliance**: Region-specific compliance settings (GDPR, etc.)

## Best Practices

1. **Save Behavior**: Implement auto-save or clear save indicators
2. **Validation**: Validate all inputs before saving
3. **Confirmation**: Require confirmation for destructive actions
4. **Help Text**: Provide contextual help for complex settings
5. **Defaults**: Set sensible defaults for new installations
6. **Search**: Add search functionality for quick setting access
7. **Change Log**: Track setting changes for audit purposes

## Accessibility

- All settings are keyboard navigable
- Screen reader compatible
- High contrast mode support
- Clear focus indicators
- Descriptive labels and help text

## Mobile Responsiveness

- Responsive grid layouts
- Touch-friendly controls
- Collapsible sections
- Mobile-optimized navigation
