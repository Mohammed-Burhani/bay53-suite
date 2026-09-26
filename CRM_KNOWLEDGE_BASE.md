# Bay53 CRM - Comprehensive Knowledge Base

## Overview

Bay53 CRM is a comprehensive Customer Relationship Management module integrated into the Bay53 inventory system. Built for sales teams managing leads, projects, and business relationships with a focus on B2B sales cycles including tender management, brand approvals, and multi-region operations.

---

## Core Modules

### 1. Dashboard Module

**Purpose**: Real-time sales performance overview and KPI monitoring

**Key Features**:
- Financial year-based filtering with FY selector
- Real-time KPI cards displaying:
  - Total Leads count with trends
  - Open Leads with Hot Lead breakdown
  - Orders Won with revenue value
  - Orders Lost with lost value tracking
  - Win Rate percentage with closed deal analysis
  - Average Deal Size calculation
- Visual analytics:
  - Monthly Lead Trend (line chart) showing leads vs won deals
  - Revenue Target vs Actual (bar chart) with monthly breakdown
  - Sales Pipeline funnel (Cold Lead → Hot Lead → Tender → Tender Won → Won)
  - Leads by Stage (donut chart)
  - Leads by Source (donut chart)
  - Value by Stage (horizontal bar chart)
  - Top Performers leaderboard showing team member performance
- Performance rings:
  - Win Rate ring showing won vs lost ratio
  - Target Attainment ring showing yearly revenue target progress
- Pending Leads alert system highlighting leads requiring follow-up
- Notifications panel showing:
  - Lead won notifications
  - Tender deadline alerts
  - Project updates
  - Hot lead reminders
  - Follow-up tasks

**Data Metrics**:
- All metrics calculated per financial year (April-March cycle)
- Monthly breakdown across 12 months
- Real-time aggregation from leads and projects data
- Team member performance tracking by won deals value

---

### 2. Leads Management Module

**Purpose**: Complete lead lifecycle management from cold lead to won/lost

**Lead Stages**:
1. Cold Lead (10% probability)
2. Hot Lead (40% probability)
3. Tender (60% probability)
4. Tender Won (80% probability)
5. Tender Lost (0% probability)
6. Won (100% probability)
7. Lost (0% probability)

**Key Features**:

**Lead Creation**:
- Title and customer name (required)
- Contact person details
- Region assignment (LIV - Bengaluru, Mumbai, Chennai, etc.)
- Vertical classification (Commercial, Residential, Hospitality, Healthcare, Education, Industrial, Infrastructure, Data Center)
- Lead source tracking (Reference, Cold Call, Website, Trade Show, Social Media, Existing Customer, Tender Portal, Consultant)
- Value estimation in INR
- Date tracking
- Assigned to team member
- Customer state selection
- Initial stage set as "Cold Lead"
- Follow-up notes capability

**Advanced Filtering**:
- Date range filtering (from/to dates)
- Region multi-select filter
- Vertical multi-select filter
- Stage multi-select filter
- Assigned To multi-select filter
- Source multi-select filter
- Status filter (Active, Closed, All)
- Value range filter (min/max)

**Lead View**:
- Comprehensive table view with columns:
  - Region, Title, State, Vertical, Value
  - Customer Name, Contact Person
  - Stage (with color-coded badges)
  - Date, Assigned To, Last Follow Up
- Individual lead detail sheets
- View and delete actions per lead
- Search and filter capabilities
- Export-ready data structure

**Follow-up Management**:
- Track last follow-up date and notes
- Follow-up history timeline
- Stage progression tracking
- Activity logging with timestamps

---

### 3. Projects Module

**Purpose**: Post-award project tracking with consultant, contractor, and brand approval management

**Key Features**:

**Project Creation**:
- Project name and region
- Consultant name tracking
- Multiple contractor details with scope definition
- Brand approval tracking across 8 disciplines:
  1. HVAC
  2. Plumbing
  3. Fire Fighting
  4. Electrical
  5. BMS (Building Management System)
  6. ELV (Extra Low Voltage)
  7. Structural
  8. Civil
- Status: Awarded / Not Awarded
- Make List availability: Available / Not Available
- Assignment to team members
- Project notes capability
- Archive functionality

**Brand Approval System**:
- Per-discipline approval tracking
- Three status levels per discipline:
  - Pending
  - Approved
  - Rejected
- Visual badge system showing approval status
- Color-coded indicators (Green: Approved, Red: Rejected, Amber: Pending)

**Contractor Management**:
- Multiple contractors per project
- Scope definition per contractor
- Add/remove contractor entries
- Contractor name and scope details

**Advanced Filtering**:
- Search by project name or consultant
- Assigned To filter
- Status filter (Awarded/Not Awarded/All)
- Region filter
- Archive visibility toggle
- Clear all filters option

**Project View**:
- Table view with columns:
  - Region, Project Name, Consultant
  - Contractors (with scope)
  - Brand Approval status badges
  - Status, Make List availability
  - Assigned To
- Individual project detail sheets
- View and delete actions
- Archive management

---

### 4. Company Management Module

**Purpose**: Organization master data and team configuration

**Key Features**:
- Company profile management
- Yearly revenue target setting
- Team member roster
- Organization-wide settings

---

### 5. CMS (Content Management System) Module

**Purpose**: Master data and configuration management

**Sub-modules**:

**a) Master Values**:
- Region management (codes and names)
- Vertical definitions
- Lead sources
- Lead stages with color coding
- Project status values
- Brand approval disciplines
- Customer states
- Team member assignments (Assigned To)
- Sort order and active/inactive status
- Custom color assignments for visual coding

**b) Notification Master**:
- Notification template creation
- Target role assignment
- Notification type configuration
- Active/inactive notification status
- Automated notification triggers
- Message templates

---

### 6. Reports Module

**Purpose**: Business intelligence and analytics

**Available Reports**:

**a) Lead Details Report**:
- Comprehensive lead listing with all attributes
- Filter by date range, probability, worth, customer
- Region and state filtering
- Stage and status filtering
- Assigned to filtering
- Exportable data

**b) Lead Activity Report**:
- Follow-up activity timeline
- Team member activity tracking
- Date range filtering
- Assigned to filtering
- Activity frequency analysis

**c) Project Details Report**:
- Complete project information
- Filter by region, status, assigned to
- Date range filtering
- Contractor and consultant details
- Brand approval status overview

**d) Sales Stage Status Report**:
- Stage-wise lead distribution
- Value aggregation by stage
- Conversion funnel analysis
- Date range and region filtering
- Team member performance breakdown

---

## Data Architecture

### Core Entities

**CRM Lead**:
```typescript
{
  id: string
  regionId: string
  title: string
  customerState: string
  vertical: string
  value: number
  customerName: string
  contactPerson: string
  stage: LeadStage
  source: string
  date: string
  assignedTo: string
  lastFollowUp: string
  lastFollowUpDate: string
  status: "active" | "closed"
  archived: boolean
  createdAt: string
  updatedAt: string
}
```

**CRM Project**:
```typescript
{
  id: string
  regionId: string
  name: string
  consultantName: string
  contractorDetails: Array<{
    name: string
    scope: string
  }>
  brandApproval: Array<{
    status: "Pending" | "Approved" | "Rejected"
    discipline: string
  }>
  status: "Awarded" | "Not Awarded"
  makeListAvailability: "Available" | "Not Available"
  assignedTo: string
  notes: CRMFollowUp[]
  archived: boolean
  createdAt: string
  updatedAt: string
}
```

**Master Lookup Item**:
```typescript
{
  id: string
  type: MasterLookupType
  code?: string
  name: string
  color?: string
  sortOrder: number
  isActive: boolean
}
```

---

## Automation Features

### 1. Notification System

**Automated Triggers**:
- **Lead Won Notification**: Triggered when lead stage changes to "Won"
- **Tender Deadline Alert**: Triggered based on tender submission dates
- **Hot Lead Reminder**: Automated reminder for hot leads without follow-up after X days
- **Project Update**: Triggered on project status changes
- **Follow-up Task**: Automated task creation for leads requiring attention

**Notification Flow**:
1. Event occurs (stage change, date trigger, status update)
2. System checks notification master rules
3. Filters by target role
4. Creates notification entry
5. Displays in dashboard notification panel
6. Dismissible by user

### 2. Stage Progression Automation

**Automatic Calculations**:
- Probability assignment based on stage
- Win rate calculation from closed leads
- Average deal size computation
- Monthly trend aggregation
- Target attainment tracking

**Stage Rules**:
- Cold Lead → Hot Lead (manual progression)
- Hot Lead → Tender (manual with date tracking)
- Tender → Tender Won/Lost (manual with value lock)
- Tender Won → Won (automatic if awarded)
- Won/Lost = final stages (closed status)

### 3. Dashboard Auto-Refresh

**Real-time Updates**:
- KPI cards refresh on data change
- Charts update on filter change
- Notification panel polls for new entries
- Financial year data recalculates on FY change

### 4. Follow-up Automation

**Automated Tracking**:
- Last follow-up date capture
- Follow-up history logging
- Overdue follow-up highlighting
- Team member activity tracking

---

## Key Workflows

### Workflow 1: Lead to Win Cycle

1. **Lead Creation**:
   - Sales team creates new lead
   - Assigns region, vertical, source
   - Sets initial value estimate
   - Assigns to team member

2. **Lead Qualification**:
   - Team member contacts customer
   - Updates stage from Cold to Hot
   - Records follow-up notes
   - Updates value estimate if needed

3. **Tender Submission**:
   - Stage progressed to "Tender"
   - Tender date recorded
   - Detailed quotation prepared
   - Follow-up scheduled

4. **Tender Result**:
   - Stage updated to "Tender Won" or "Tender Lost"
   - If won, project created automatically or manually

5. **Project Creation**:
   - Lead marked as "Won"
   - New project record created
   - Status set to "Awarded"
   - Consultant and contractor details added

6. **Brand Approval Process**:
   - For each discipline, submit for approval
   - Track approval status (Pending → Approved/Rejected)
   - Update make list availability

7. **Project Execution**:
   - Follow-up notes for project milestones
   - Status tracking
   - Final completion

### Workflow 2: Report Generation

1. **Select Report Type**:
   - Lead Details
   - Lead Activity
   - Project Details
   - Sales Stage Status

2. **Apply Filters**:
   - Date range
   - Region, vertical, stage
   - Assigned to, status
   - Value range

3. **View Results**:
   - Table format with all columns
   - Sortable and searchable
   - Export to Excel/PDF

4. **Analysis**:
   - Identify trends
   - Team performance
   - Conversion rates
   - Revenue forecasting

### Workflow 3: Master Data Management

1. **Access CMS Module**:
   - Navigate to CMS → Master Values

2. **Manage Master Data**:
   - Add new regions with codes
   - Define new verticals
   - Add lead sources
   - Configure team members
   - Set sort orders

3. **Configure Notifications**:
   - Create notification templates
   - Set trigger conditions
   - Define target roles
   - Activate/deactivate rules

4. **Apply Changes**:
   - Changes reflect immediately
   - Dropdowns update across modules
   - Existing data remains intact

---

## UI/UX Features

### Visual Design System

**Color Coding**:
- Stage badges with consistent color scheme:
  - Cold Lead: Blue (#3b82f6)
  - Hot Lead: Amber (#f59e0b)
  - Tender: Purple (#a855f7)
  - Tender Won: Green (#22c55e)
  - Tender Lost: Red (#ef4444)
  - Won: Emerald (#10b981)
  - Lost: Gray (#9ca3af)

**Dashboard Aesthetics**:
- Gradient header (lime-green-emerald)
- Compact stat cards with icons
- Responsive charts with hover tooltips
- Ring gauges for percentage metrics
- Alert cards for pending actions

**Interactive Elements**:
- Multi-select checkboxes for filters
- Searchable dropdowns
- Date pickers
- Modal dialogs for create/edit
- Side sheets for detail views
- Table actions (view, edit, delete)

### Responsive Design

**Breakpoints**:
- Mobile: Single column layouts
- Tablet: 2-column grids
- Desktop: 3-6 column grids
- Large desktop: Expanded chart views

**Component Adaptations**:
- Collapsible filters on mobile
- Horizontal scroll tables
- Touch-friendly buttons
- Responsive modals

---

## Technical Stack

**Frontend**:
- Next.js 14 with App Router
- React 18 with TypeScript
- Tailwind CSS for styling
- Shadcn/ui component library
- Recharts for data visualization
- Zustand for state management

**Backend**:
- Supabase (PostgreSQL)
- Row Level Security (RLS)
- Real-time subscriptions
- Edge functions

**Key Libraries**:
- React Query for data fetching
- Lucide React for icons
- date-fns for date handling
- Zod for validation

---

## Security & Permissions

### Row Level Security (RLS)

**Organization Isolation**:
- All data scoped to organization_id
- Users can only access their organization's data
- Enforced at database level

**User Roles**:
- Admin: Full access to all modules
- User: Standard access to leads, projects, reports
- Viewer: Read-only access

**Data Policies**:
- Users can view data in their organization
- Users can create/update/delete based on role
- RLS policies enforce at query level

---

## Performance Optimizations

**Data Loading**:
- React Query caching
- Optimistic updates
- Pagination for large datasets
- Lazy loading for charts

**Filtering**:
- Client-side filtering for small datasets
- Server-side filtering for reports
- Debounced search inputs
- Indexed database queries

**Chart Rendering**:
- Memoized calculations
- Virtualized lists for large data
- Responsive container sizing
- Lazy chart initialization

---

## Integration Points

### ERP Module Integration

**Shared Data**:
- Organizations and user profiles
- Financial year settings
- Currency formatting

**Cross-Module Navigation**:
- Dashboard links to leads/projects
- Lead to invoice conversion (future)
- Project to purchase order creation (future)

---

## Future Enhancements

**Planned Features**:
1. Email integration for follow-ups
2. WhatsApp notifications
3. Document attachment to leads/projects
4. Quotation generation from leads
5. Lead scoring with AI
6. Forecast modeling
7. Mobile app
8. API integrations with tender portals

---

## Best Practices

### Data Entry Guidelines

**Lead Creation**:
- Always enter accurate customer names
- Provide contact person details
- Set realistic value estimates
- Add detailed follow-up notes
- Update stage promptly

**Project Management**:
- Enter all contractor details with scope
- Track brand approvals diligently
- Update status immediately on award
- Maintain project notes timeline

**Follow-up Discipline**:
- Record every customer interaction
- Set next follow-up dates
- Update value estimates after discussions
- Progress stages only after confirmation

### Reporting Best Practices

**Regular Reviews**:
- Weekly: Lead activity report
- Monthly: Sales stage status report
- Quarterly: Win rate and target attainment
- Yearly: Revenue vs target analysis

**Filter Usage**:
- Start broad, then narrow filters
- Use date ranges for trend analysis
- Filter by team member for performance reviews
- Combine multiple filters for insights

---

## Glossary

**Terms**:
- **Lead**: Potential customer opportunity
- **Hot Lead**: Qualified lead with high conversion probability
- **Tender**: Formal quotation submission process
- **Brand Approval**: Client approval for specific product brands
- **Make List**: Approved list of brands/products for project
- **Consultant**: Third-party project consultant
- **Contractor**: Project execution partner
- **Financial Year**: April to March fiscal year
- **Win Rate**: Percentage of won deals from closed deals
- **Pipeline**: All active leads in various stages

---

## Support & Maintenance

**Data Backup**:
- Daily automated backups
- Point-in-time recovery
- 30-day retention

**System Monitoring**:
- Uptime tracking
- Error logging
- Performance metrics

**User Support**:
- In-app help tooltips
- Documentation access
- Admin support contact

---

## Version History

**Current Version**: 1.0
- Initial release with core modules
- Dashboard, Leads, Projects, CMS, Reports
- Notification automation
- Multi-region support

---

*Last Updated: 2026-09-18*
*Document Owner: Bay53 CRM Team*
