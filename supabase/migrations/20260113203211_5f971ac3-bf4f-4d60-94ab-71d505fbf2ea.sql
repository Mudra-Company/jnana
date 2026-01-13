-- Step 1: Remove duplicate active shortlists (keep only the most recent one per position)
DELETE FROM position_shortlists
WHERE id IN (
  SELECT id FROM (
    SELECT id, 
           ROW_NUMBER() OVER (
             PARTITION BY position_id 
             ORDER BY created_at DESC
           ) as rn
    FROM position_shortlists
    WHERE status = 'active'
  ) ranked
  WHERE rn > 1
);

-- Step 2: Create partial unique index to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_shortlist_per_position 
ON position_shortlists (position_id) 
WHERE (status = 'active');