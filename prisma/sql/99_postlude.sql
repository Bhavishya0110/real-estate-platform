-- =============================================================================
-- POSTLUDE — everything Prisma's schema language cannot express.
--
-- Full-text search, fuzzy matching, partial indexes, CHECK constraints and the
-- triggers that enforce rules the application must not be trusted to remember.
-- =============================================================================

-- ------------------------------------------------------- full-text search ---
--
-- Replaces the client-side matchesQuery() that concatenated 13 fields and
-- substring-matched them in the browser. Weighted so a name match outranks a
-- description match.
--
-- Trigger-maintained rather than GENERATED: a generated column would be a
-- different column type in Prisma's eyes and would be proposed for deletion on
-- the next `migrate dev`. A plain column keeps the schema and the database in
-- agreement.

CREATE OR REPLACE FUNCTION projects_search_vector_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', unaccent(coalesce(NEW.name, ''))), 'A') ||
    setweight(to_tsvector('english', unaccent(coalesce(NEW.tagline, ''))), 'B') ||
    setweight(to_tsvector('english', unaccent(coalesce(NEW.display_locality, ''))), 'B') ||
    setweight(to_tsvector('english', unaccent(coalesce(NEW.description, ''))), 'C') ||
    setweight(to_tsvector('english', unaccent(coalesce(NEW.long_description, ''))), 'D');
  RETURN NEW;
END;
$$;

CREATE TRIGGER projects_search_vector_trigger
  BEFORE INSERT OR UPDATE OF name, tagline, display_locality, description, long_description
  ON projects
  FOR EACH ROW EXECUTE FUNCTION projects_search_vector_update();

CREATE OR REPLACE FUNCTION blog_posts_search_vector_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', unaccent(coalesce(NEW.title, ''))), 'A') ||
    setweight(to_tsvector('english', unaccent(coalesce(NEW.excerpt, ''))), 'B') ||
    setweight(to_tsvector('english', unaccent(coalesce(NEW.content_text, ''))), 'C');
  RETURN NEW;
END;
$$;

CREATE TRIGGER blog_posts_search_vector_trigger
  BEFORE INSERT OR UPDATE OF title, excerpt, content_text
  ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION blog_posts_search_vector_update();

CREATE OR REPLACE FUNCTION faqs_search_vector_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', unaccent(coalesce(NEW.question, ''))), 'A') ||
    setweight(to_tsvector('english', unaccent(coalesce(NEW.answer, ''))), 'B');
  RETURN NEW;
END;
$$;

CREATE TRIGGER faqs_search_vector_trigger
  BEFORE INSERT OR UPDATE OF question, answer
  ON faqs
  FOR EACH ROW EXECUTE FUNCTION faqs_search_vector_update();

CREATE INDEX projects_search_idx   ON projects   USING GIN (search_vector);
CREATE INDEX blog_posts_search_idx ON blog_posts USING GIN (search_vector);
CREATE INDEX faqs_search_idx       ON faqs       USING GIN (search_vector);

-- Typo tolerance for name autocomplete ("crosswak" still finds Crosswalk).
CREATE INDEX projects_name_trgm_idx ON projects USING GIN (name gin_trgm_ops);
CREATE INDEX contacts_name_trgm_idx ON contacts USING GIN (full_name gin_trgm_ops);

-- ----------------------------------------------------------- partial indexes -
--
-- The hot paths only ever read live rows. Indexing just those keeps them a
-- fraction of the size and skips the soft-deleted tail entirely.

CREATE INDEX projects_live_idx ON projects (published_at DESC)
  WHERE deleted_at IS NULL AND publish_status = 'PUBLISHED';

CREATE INDEX blog_posts_live_idx ON blog_posts (published_at DESC)
  WHERE deleted_at IS NULL AND publish_status = 'PUBLISHED';

CREATE INDEX jobs_live_idx ON jobs (published_at DESC)
  WHERE deleted_at IS NULL AND publish_status = 'PUBLISHED';

CREATE INDEX leads_open_idx ON leads (owner_id, next_follow_up_at)
  WHERE deleted_at IS NULL AND closed_at IS NULL;

CREATE INDEX sessions_live_idx ON sessions (user_id)
  WHERE revoked_at IS NULL;

CREATE INDEX media_assets_live_idx ON media_assets (created_at DESC)
  WHERE deleted_at IS NULL;

-- ------------------------------------------------------------- constraints --

-- "Alt text on every asset, enforced before publishing" — a database rule, so a
-- bulk import cannot walk past it the way it would past form validation.
ALTER TABLE media_assets ADD CONSTRAINT media_image_requires_alt
  CHECK (kind <> 'IMAGE' OR (alt_text IS NOT NULL AND length(trim(alt_text)) > 0));

ALTER TABLE projects ADD CONSTRAINT projects_price_range_valid
  CHECK (price_to_minor IS NULL OR price_from_minor IS NULL OR price_to_minor >= price_from_minor);

ALTER TABLE projects ADD CONSTRAINT projects_area_range_valid
  CHECK (area_max IS NULL OR area_min IS NULL OR area_max >= area_min);

ALTER TABLE projects ADD CONSTRAINT projects_price_non_negative
  CHECK (price_from_minor IS NULL OR price_from_minor >= 0);

ALTER TABLE testimonials ADD CONSTRAINT testimonials_rating_range
  CHECK (rating BETWEEN 1 AND 5);

ALTER TABLE site_visits ADD CONSTRAINT site_visits_rating_range
  CHECK (feedback_rating IS NULL OR feedback_rating BETWEEN 1 AND 5);

ALTER TABLE construction_updates ADD CONSTRAINT construction_progress_range
  CHECK (progress_percentage IS NULL OR progress_percentage BETWEEN 0 AND 100);

ALTER TABLE job_applications ADD CONSTRAINT job_applications_rating_range
  CHECK (rating IS NULL OR rating BETWEEN 1 AND 5);

ALTER TABLE feature_flags ADD CONSTRAINT feature_flags_rollout_range
  CHECK (rollout_percent BETWEEN 0 AND 100);

ALTER TABLE lead_stages ADD CONSTRAINT lead_stages_probability_range
  CHECK (probability IS NULL OR probability BETWEEN 0 AND 100);

ALTER TABLE lead_stages ADD CONSTRAINT lead_stages_not_both_outcomes
  CHECK (NOT (is_won AND is_lost));

-- An SEO override targets exactly one thing: a static path, a project, or a post.
ALTER TABLE seo_settings ADD CONSTRAINT seo_single_target CHECK (
  (path IS NOT NULL)::int + (project_id IS NOT NULL)::int + (blog_post_id IS NOT NULL)::int = 1
);

ALTER TABLE redirects ADD CONSTRAINT redirects_status_code_valid
  CHECK (status_code IN (301, 302, 307, 308));

ALTER TABLE redirects ADD CONSTRAINT redirects_no_self_loop
  CHECK (from_path <> to_path);

-- ------------------------------------------------------------ unique rules --

-- Exactly one primary office, enforced rather than assumed.
CREATE UNIQUE INDEX offices_single_primary ON offices (is_primary) WHERE is_primary;

-- One default pipeline.
CREATE UNIQUE INDEX lead_pipelines_single_default ON lead_pipelines (is_default) WHERE is_default;

-- A contact may hold one active consent per purpose.
CREATE UNIQUE INDEX contact_consents_active_purpose
  ON contact_consents (contact_id, purpose) WHERE withdrawn_at IS NULL;

-- ---------------------------------------------------------------- triggers --

-- The compare tray caps selection at 3 in the browser (COMPARE_LIMIT). A
-- client-side cap is a UX affordance, not a guarantee — this is the guarantee.
CREATE OR REPLACE FUNCTION enforce_comparison_limit()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (SELECT count(*) FROM comparison_set_items WHERE set_id = NEW.set_id) >= 4 THEN
    RAISE EXCEPTION 'A comparison may hold at most 4 projects';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER comparison_limit
  BEFORE INSERT ON comparison_set_items
  FOR EACH ROW EXECUTE FUNCTION enforce_comparison_limit();

-- updated_at maintained by the database as well as by Prisma's @updatedAt, so a
-- raw SQL migration or a bulk import cannot leave a stale timestamp behind.
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  target record;
BEGIN
  FOR target IN
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_name = c.table_name AND t.table_schema = c.table_schema
    WHERE c.table_schema = 'public'
      AND c.column_name = 'updated_at'
      AND t.table_type = 'BASE TABLE'
  LOOP
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION touch_updated_at()',
      target.table_name || '_touch_updated_at',
      target.table_name
    );
  END LOOP;
END;
$$;

-- Keep the denormalised conversation counter honest without a COUNT(*) per read.
CREATE OR REPLACE FUNCTION chat_conversation_counters()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE chat_conversations
     SET message_count    = message_count + 1,
         unanswered_count = unanswered_count + CASE WHEN NEW.was_unanswered THEN 1 ELSE 0 END
   WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER chat_messages_counters
  AFTER INSERT ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION chat_conversation_counters();
