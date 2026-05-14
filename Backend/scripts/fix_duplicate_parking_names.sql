-- Run against smartparking_db if parkings.name has duplicates and adding UNIQUE fails.
-- Keeps the lowest id per name (case-insensitive); renames other rows so names stay unique.

UPDATE parkings p
INNER JOIN (
  SELECT MIN(id) AS keep_id, LOWER(TRIM(name)) AS nkey
  FROM parkings
  GROUP BY LOWER(TRIM(name))
  HAVING COUNT(*) > 1
) dup ON LOWER(TRIM(p.name)) = dup.nkey AND p.id <> dup.keep_id
SET p.name = CONCAT(TRIM(p.name), ' (#', p.id, ')');
