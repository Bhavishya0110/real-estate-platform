-- Preserves editorial possession phrasing that a date cannot reproduce.
--
-- Six of the fourteen seeded projects describe handover in words rather than a
-- month — "Ready for Fit-out", "Phase-wise from 2026", "Immediate Registration".
-- Only one of the seven non-date values mirrors the project status, so deriving
-- the label from status would rewrite what the site says about six projects.
--
-- Same rule the design applies to price_label_override: derive from the fact
-- where possible, retain the original only where it cannot be reproduced.
ALTER TABLE "projects" ADD COLUMN "possession_label_override" VARCHAR(120);
