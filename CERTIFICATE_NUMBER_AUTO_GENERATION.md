# Certificate Number Auto-Generation Feature

## Overview
The certificate form now automatically generates certificate numbers based on the invoice number, while still allowing users to modify them if needed.

## How It Works

### Auto-Generation
1. When a user enters an invoice number in create or duplicate mode, the system automatically generates a certificate number
2. The generation happens in the background using the configured format from `certificate_config` table
3. The generated number appears in the "Certificate Number" field

### Manual Override
- Users can click the "Generate" button to regenerate the certificate number
- Users can manually type/edit the certificate number field at any time
- The system will use whatever value is in the field when creating the certificate

### Generation Logic
The certificate number is generated based on the configuration in the `certificate_config` table:

**Default Format:** `CERT-{invoice_number}-{counter}`

**Example:** `CERT-INV001-0001`

**Configurable Parts:**
- Prefix (default: "CERT")
- Separator (default: "-")
- Include invoice number (default: true)
- Include date (default: false)
- Counter padding (default: 4 digits)

## UI Components

### Certificate Number Field
```
┌─────────────────────────────────────────────────────────────┐
│ Certificate Number                                          │
│ ┌────────────────────────────────────────┬─────────────┐   │
│ │ CERT-INV001-0001                       │  Generate   │   │
│ └────────────────────────────────────────┴─────────────┘   │
│ Auto-generated based on invoice number. You can modify it. │
└─────────────────────────────────────────────────────────────┘
```

### Features
- **Auto-fill**: Generates automatically when invoice number is entered
- **Generate Button**: Manually trigger regeneration
- **Editable**: Users can type their own certificate number
- **Loading State**: Shows "Generating..." when in progress
- **Disabled State**: Generate button is disabled if no invoice number

## Behavior by Mode

### Create Mode
- Auto-generates when invoice number is entered
- Field starts empty
- User can modify or regenerate

### Edit Mode
- Shows existing certificate number
- Does NOT auto-generate (preserves original number)
- User can still manually edit

### Duplicate Mode
- Auto-generates new certificate number
- Does NOT copy the original certificate number
- User can modify or regenerate

## Code Changes

### Files Modified
1. **components/certificates/ManualCertificateForm.tsx**
   - Added certificate_number field to form
   - Added auto-generation logic with useEffect
   - Added Generate button
   - Added loading state

2. **lib/services/certificates.service.ts**
   - Updated CreateCertificateInput to accept optional certificate_number
   - Modified createCertificate to use provided number or generate one

### Key Functions

#### generateCertificateNumber()
```typescript
const generateCertificateNumber = useCallback(async () => {
  if (!invoiceNumber) {
    toast.error("Please enter an invoice number first");
    return;
  }
  
  setIsGeneratingCertNumber(true);
  try {
    const { certificatesService } = await import("@/lib/services/certificates.service");
    const certNumber = await certificatesService.generateCertificateNumber(
      organizationId,
      invoiceNumber
    );
    setValue("certificate_number", certNumber);
    toast.success("Certificate number generated");
  } catch (error) {
    console.error("Error generating certificate number:", error);
    toast.error("Failed to generate certificate number");
  } finally {
    setIsGeneratingCertNumber(false);
  }
}, [invoiceNumber, organizationId, setValue]);
```

#### Auto-generation Effect
```typescript
useEffect(() => {
  if (mode !== 'edit' && invoiceNumber && !watch("certificate_number")) {
    generateCertificateNumber();
  }
}, [invoiceNumber, mode, generateCertificateNumber, watch]);
```

## Configuration

To customize the certificate number format, update the `certificate_config` table:

```sql
UPDATE certificate_config
SET 
  certificate_prefix = 'CAL',           -- Change prefix
  certificate_separator = '/',          -- Change separator
  include_invoice_number = true,        -- Include invoice number
  include_date = true,                  -- Include date
  date_format = 'YYYYMMDD',            -- Date format
  counter_start = 1,                    -- Starting counter
  counter_padding = 4                   -- Number of digits
WHERE organization_id = 'your-org-id';
```

**Result:** `CAL/INV001/20260409/0001`

## User Experience

### Typical Workflow
1. User opens "Create New Certificate" dialog
2. User enters invoice number (e.g., "INV001")
3. Certificate number auto-generates (e.g., "CERT-INV001-0001")
4. User can:
   - Keep the generated number
   - Click "Generate" to get a new number
   - Manually edit the number
5. User fills in other details and submits

### Error Handling
- If generation fails, user sees error toast
- User can still manually enter a certificate number
- Generate button is disabled without invoice number

## Benefits
1. **Consistency**: Automatic generation ensures consistent numbering
2. **Flexibility**: Users can override when needed
3. **Efficiency**: Saves time by auto-filling
4. **Control**: Users maintain full control over the final number
5. **Audit Trail**: All certificate numbers are tracked in the database

## Testing Checklist
- [ ] Create new certificate - auto-generates number
- [ ] Edit existing certificate - preserves original number
- [ ] Duplicate certificate - generates new number
- [ ] Click Generate button - regenerates number
- [ ] Manually edit number - accepts custom value
- [ ] Submit with auto-generated number - saves correctly
- [ ] Submit with custom number - saves correctly
- [ ] Generate without invoice number - shows error
- [ ] Multiple certificates from same invoice - increments counter
