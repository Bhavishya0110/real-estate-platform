-- Restores the per-project editorial feature list.
--
-- The design's table list included project_highlights; the first schema draft
-- omitted it on the assumption the labels could be derived from capability
-- flags. They cannot: only one of fourteen projects matched a derived list, and
-- the values are marketing copy ("Plot Selector", "Phase Tracker", "ROI
-- Calculator") rendered on the project page and included in the search corpus.
CREATE TABLE "project_highlights" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "project_id" UUID NOT NULL,
    "label" VARCHAR(120) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "project_highlights_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "project_highlights_project_id_label_key"
    ON "project_highlights"("project_id", "label");

CREATE INDEX "project_highlights_project_id_sort_order_idx"
    ON "project_highlights"("project_id", "sort_order");

ALTER TABLE "project_highlights"
    ADD CONSTRAINT "project_highlights_project_id_fkey"
    FOREIGN KEY ("project_id") REFERENCES "projects"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
