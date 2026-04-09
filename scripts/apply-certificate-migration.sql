-- =====================================================
-- Migration: Add test_results_common_field to certificates
-- Date: 2026-04-09
-- Description: Adds a common field for test results that 
--              displays as a merged cell in PDF output
-- =====================================================

-- Add the column if it doesn't exist
ALTER TABLE certificates 
ADD COLUMN IF NOT EXISTS test_results_common_field TEXT;

-- Add comment
COMMENT ON COLUMN certificates.test_results_common_field IS 'Common field that applies to all test result rows, displayed as merged column in PDF (e.g., Calibrated Range: 0-100 PSI)';

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'certificates' 
  AND column_name = 'test_results_common_field';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully! Column test_results_common_field added to certificates table.';
END $$;
