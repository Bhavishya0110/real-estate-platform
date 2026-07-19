-- =============================================================================
-- PRELUDE — runs before any table is created.
--
-- Every primary key defaults to uuid_generate_v7(), so the function has to
-- exist before the first CREATE TABLE references it.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- UUID v7: a 48-bit millisecond timestamp followed by random bits.
--
-- Chosen over v4 because primary keys are inserted in time order, so new rows
-- land at the right-hand edge of the B-tree instead of scattering writes across
-- every page. Same uniqueness guarantees, far better index locality — which is
-- the difference between an index that stays compact and one that bloats.
--
-- Postgres 18 ships uuidv7() natively; this is the portable equivalent until
-- Supabase is on a version that has it.
CREATE OR REPLACE FUNCTION uuid_generate_v7()
RETURNS uuid
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  ts_ms      bigint;
  uuid_bytes bytea;
BEGIN
  ts_ms := (extract(epoch FROM clock_timestamp()) * 1000)::bigint;

  -- Start from 128 random bits, then overwrite the leading 48 with the clock.
  uuid_bytes := uuid_send(gen_random_uuid());

  uuid_bytes := set_byte(uuid_bytes, 0, ((ts_ms >> 40) & 255)::int);
  uuid_bytes := set_byte(uuid_bytes, 1, ((ts_ms >> 32) & 255)::int);
  uuid_bytes := set_byte(uuid_bytes, 2, ((ts_ms >> 24) & 255)::int);
  uuid_bytes := set_byte(uuid_bytes, 3, ((ts_ms >> 16) & 255)::int);
  uuid_bytes := set_byte(uuid_bytes, 4, ((ts_ms >>  8) & 255)::int);
  uuid_bytes := set_byte(uuid_bytes, 5, ( ts_ms        & 255)::int);

  -- Version 7 in the high nibble of byte 6 (0x70).
  uuid_bytes := set_byte(uuid_bytes, 6, ((get_byte(uuid_bytes, 6) & 15) | 112));
  -- RFC 4122 variant in the top two bits of byte 8 (0x80).
  uuid_bytes := set_byte(uuid_bytes, 8, ((get_byte(uuid_bytes, 8) & 63) | 128));

  RETURN encode(uuid_bytes, 'hex')::uuid;
END;
$$;

-- ========================= GENERATED SCHEMA (prisma migrate diff) ==========

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- CreateEnum
CREATE TYPE "publish_status" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'DISABLED');

-- CreateEnum
CREATE TYPE "media_kind" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "media_role" AS ENUM ('HERO', 'GALLERY', 'THUMBNAIL', 'MASTER_PLAN', 'LOCATION_MAP', 'LOGO', 'WALKTHROUGH', 'DRONE');

-- CreateEnum
CREATE TYPE "document_kind" AS ENUM ('BROCHURE', 'FLOOR_PLAN', 'PRICE_SHEET', 'RERA_CERTIFICATE', 'LEGAL_APPROVAL', 'PAYMENT_PLAN', 'FACT_SHEET');

-- CreateEnum
CREATE TYPE "access_level" AS ENUM ('PUBLIC', 'LEAD_GATED', 'AUTHENTICATED', 'INTERNAL');

-- CreateEnum
CREATE TYPE "date_precision" AS ENUM ('DAY', 'MONTH', 'QUARTER', 'YEAR');

-- CreateEnum
CREATE TYPE "area_unit" AS ENUM ('SQFT', 'SQM', 'SQYD', 'ACRE');

-- CreateEnum
CREATE TYPE "currency" AS ENUM ('INR');

-- CreateEnum
CREATE TYPE "chat_role" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "feedback_rating" AS ENUM ('HELPFUL', 'NOT_HELPFUL');

-- CreateEnum
CREATE TYPE "notification_channel" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'WHATSAPP', 'PUSH');

-- CreateEnum
CREATE TYPE "delivery_status" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'BOUNCED');

-- CreateEnum
CREATE TYPE "activity_type" AS ENUM ('NOTE', 'CALL', 'EMAIL', 'WHATSAPP', 'SMS', 'MEETING', 'SITE_VISIT', 'STAGE_CHANGE', 'ASSIGNMENT', 'FILE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "consent_purpose" AS ENUM ('TRANSACTIONAL', 'MARKETING', 'ANALYTICS', 'PROFILING');

-- CreateEnum
CREATE TYPE "audit_action" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'PUBLISH', 'UNPUBLISH', 'RESTORE', 'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PERMISSION_CHANGE', 'EXPORT');

-- CreateEnum
CREATE TYPE "application_status" AS ENUM ('RECEIVED', 'SCREENING', 'INTERVIEWING', 'OFFERED', 'HIRED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "visit_status" AS ENUM ('REQUESTED', 'SCHEDULED', 'CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED');

-- CreateEnum
CREATE TYPE "tour_provider" AS ENUM ('MATTERPORT', 'KUULA', 'CUSTOM_IFRAME', 'YOUTUBE_360');

-- CreateEnum
CREATE TYPE "setting_type" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'URL', 'EMAIL', 'PHONE', 'RICH_TEXT');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "email" CITEXT NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "phone" VARCHAR(20),
    "password_hash" VARCHAR(255) NOT NULL,
    "password_changed_at" TIMESTAMPTZ(6),
    "avatar_media_id" UUID,
    "status" "user_status" NOT NULL DEFAULT 'INVITED',
    "email_verified_at" TIMESTAMPTZ(6),
    "mfa_secret" VARCHAR(255),
    "mfa_enabled_at" TIMESTAMPTZ(6),
    "failed_login_count" SMALLINT NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ(6),
    "last_login_at" TIMESTAMPTZ(6),
    "timezone" VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
    "created_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "slug" VARCHAR(64) NOT NULL,
    "name" VARCHAR(96) NOT NULL,
    "description" TEXT,
    "parent_role_id" UUID,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "rank" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "resource" VARCHAR(64) NOT NULL,
    "action" VARCHAR(32) NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "scope_type" VARCHAR(32),
    "scope_id" UUID,
    "granted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "user_permissions" (
    "user_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "effect" BOOLEAN NOT NULL,
    "reason" TEXT,
    "granted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("user_id","permission_id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "ip_address" INET,
    "user_agent" TEXT,
    "device_label" VARCHAR(120),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "revoked_reason" VARCHAR(120),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_ip" INET,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_attempts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "email" CITEXT NOT NULL,
    "user_id" UUID,
    "successful" BOOLEAN NOT NULL,
    "failure_code" VARCHAR(40),
    "ip_address" INET,
    "user_agent" TEXT,
    "attempted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "actor_id" UUID,
    "actor_email" CITEXT,
    "action" "audit_action" NOT NULL,
    "entity_type" VARCHAR(64) NOT NULL,
    "entity_id" UUID,
    "entity_label" VARCHAR(255),
    "before" JSONB,
    "after" JSONB,
    "diff_keys" TEXT[],
    "ip_address" INET,
    "user_agent" TEXT,
    "request_id" VARCHAR(64),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "name" VARCHAR(120) NOT NULL,
    "key_prefix" VARCHAR(12) NOT NULL,
    "key_hash" VARCHAR(64) NOT NULL,
    "scopes" TEXT[],
    "created_by_id" UUID NOT NULL,
    "last_used_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "slug" VARCHAR(140) NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "category_id" UUID NOT NULL,
    "location_id" UUID,
    "project_status_id" UUID NOT NULL,
    "publish_status" "publish_status" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMPTZ(6),
    "tagline" VARCHAR(220),
    "description" TEXT NOT NULL,
    "long_description" TEXT,
    "address_line" VARCHAR(255),
    "display_locality" VARCHAR(180) NOT NULL,
    "pin_code" VARCHAR(10),
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "price_from_minor" BIGINT,
    "price_to_minor" BIGINT,
    "currency" "currency" NOT NULL DEFAULT 'INR',
    "price_label_override" VARCHAR(120),
    "price_on_request" BOOLEAN NOT NULL DEFAULT false,
    "area_min" DECIMAL(12,2),
    "area_max" DECIMAL(12,2),
    "area_unit" "area_unit" NOT NULL DEFAULT 'SQFT',
    "possession_on" DATE,
    "possession_precision" "date_precision" NOT NULL DEFAULT 'MONTH',
    "launched_on" DATE,
    "total_units" INTEGER,
    "available_units" INTEGER,
    "total_area_acres" DECIMAL(10,2),
    "tower_count" SMALLINT,
    "floor_count" SMALLINT,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "featured_rank" SMALLINT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "search_vector" tsvector,
    "created_by_id" UUID,
    "updated_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_categories" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "slug" VARCHAR(64) NOT NULL,
    "name" VARCHAR(96) NOT NULL,
    "description" TEXT,
    "is_residential" BOOLEAN NOT NULL DEFAULT true,
    "is_commercial" BOOLEAN NOT NULL DEFAULT false,
    "icon_name" VARCHAR(64),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "project_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_statuses" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "slug" VARCHAR(48) NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "color_token" VARCHAR(32),
    "is_sellable" BOOLEAN NOT NULL DEFAULT true,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "project_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "slug" VARCHAR(120) NOT NULL,
    "name" VARCHAR(140) NOT NULL,
    "type" VARCHAR(32) NOT NULL,
    "parent_id" UUID,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amenity_groups" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "slug" VARCHAR(64) NOT NULL,
    "name" VARCHAR(96) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "amenity_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amenities" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "slug" VARCHAR(96) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "group_id" UUID,
    "icon_name" VARCHAR(64),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "amenities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_amenities" (
    "project_id" UUID NOT NULL,
    "amenity_id" UUID NOT NULL,
    "is_highlighted" BOOLEAN NOT NULL DEFAULT false,
    "note" VARCHAR(200),
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "project_amenities_pkey" PRIMARY KEY ("project_id","amenity_id")
);

-- CreateTable
CREATE TABLE "unit_configurations" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "slug" VARCHAR(48) NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "bedrooms" SMALLINT,
    "is_commercial" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "unit_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_unit_types" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "project_id" UUID NOT NULL,
    "configuration_id" UUID NOT NULL,
    "label" VARCHAR(120),
    "carpet_area" DECIMAL(12,2),
    "built_up_area" DECIMAL(12,2),
    "super_area" DECIMAL(12,2),
    "area_unit" "area_unit" NOT NULL DEFAULT 'SQFT',
    "price_minor" BIGINT,
    "currency" "currency" NOT NULL DEFAULT 'INR',
    "total_units" INTEGER,
    "available_units" INTEGER,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "project_unit_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "floor_plans" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "unit_type_id" UUID NOT NULL,
    "media_id" UUID NOT NULL,
    "title" VARCHAR(140) NOT NULL,
    "access_level" "access_level" NOT NULL DEFAULT 'PUBLIC',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "floor_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nearby_places" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "project_id" UUID NOT NULL,
    "category" VARCHAR(48) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "distance_km" DECIMAL(6,2),
    "travel_minutes" SMALLINT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "nearby_places_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construction_updates" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "project_id" UUID NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "progress_percentage" SMALLINT,
    "tower_label" VARCHAR(64),
    "captured_on" DATE NOT NULL,
    "publish_status" "publish_status" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMPTZ(6),
    "created_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "construction_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construction_update_media" (
    "update_id" UUID NOT NULL,
    "media_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "construction_update_media_pkey" PRIMARY KEY ("update_id","media_id")
);

-- CreateTable
CREATE TABLE "rera_registrations" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "project_id" UUID NOT NULL,
    "registration_number" VARCHAR(120) NOT NULL,
    "authority" VARCHAR(64) NOT NULL DEFAULT 'HRERA',
    "phase_label" VARCHAR(96),
    "registered_on" DATE,
    "valid_until" DATE,
    "certificate_media_id" UUID,
    "qr_code_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "rera_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_price_history" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "project_id" UUID NOT NULL,
    "unit_type_id" UUID,
    "old_price_minor" BIGINT,
    "new_price_minor" BIGINT NOT NULL,
    "currency" "currency" NOT NULL DEFAULT 'INR',
    "changed_by_id" UUID,
    "reason" VARCHAR(255),
    "effective_from" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_price_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "virtual_tours" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "project_id" UUID NOT NULL,
    "unit_type_id" UUID,
    "title" VARCHAR(160) NOT NULL,
    "provider" "tour_provider" NOT NULL DEFAULT 'CUSTOM_IFRAME',
    "embed_url" TEXT NOT NULL,
    "thumbnail_media_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "virtual_tours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_assignments" (
    "project_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" VARCHAR(48) NOT NULL,
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_assignments_pkey" PRIMARY KEY ("project_id","user_id","role")
);

-- CreateTable
CREATE TABLE "media_folders" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "name" VARCHAR(140) NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "parent_id" UUID,
    "path" VARCHAR(600) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "folder_id" UUID,
    "kind" "media_kind" NOT NULL,
    "bucket" VARCHAR(64) NOT NULL,
    "storage_path" VARCHAR(700) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(128) NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "checksum_sha256" VARCHAR(64),
    "width" INTEGER,
    "height" INTEGER,
    "duration_ms" INTEGER,
    "blur_data_url" TEXT,
    "dominant_color" VARCHAR(9),
    "alt_text" VARCHAR(400),
    "caption" TEXT,
    "credit" VARCHAR(200),
    "access_level" "access_level" NOT NULL DEFAULT 'PUBLIC',
    "uploaded_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_variants" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "media_id" UUID NOT NULL,
    "label" VARCHAR(32) NOT NULL,
    "format" VARCHAR(16) NOT NULL,
    "bucket" VARCHAR(64) NOT NULL,
    "storage_path" VARCHAR(700) NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "size_bytes" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_media" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "project_id" UUID NOT NULL,
    "media_id" UUID NOT NULL,
    "role" "media_role" NOT NULL DEFAULT 'GALLERY',
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "project_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_documents" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "project_id" UUID NOT NULL,
    "media_id" UUID NOT NULL,
    "kind" "document_kind" NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "access_level" "access_level" NOT NULL DEFAULT 'LEAD_GATED',
    "version" VARCHAR(32),
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "galleries" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "slug" VARCHAR(140) NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "publish_status" "publish_status" NOT NULL DEFAULT 'DRAFT',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "galleries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gallery_items" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "gallery_id" UUID NOT NULL,
    "media_id" UUID NOT NULL,
    "caption" VARCHAR(300),
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "gallery_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitors" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "anonymous_id" VARCHAR(64) NOT NULL,
    "contact_id" UUID,
    "first_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "first_referrer" TEXT,
    "first_utm_source" VARCHAR(120),
    "first_utm_medium" VARCHAR(120),
    "first_utm_campaign" VARCHAR(160),
    "country_code" VARCHAR(2),
    "device_type" VARCHAR(24),

    CONSTRAINT "visitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "phone_normalized" VARCHAR(20) NOT NULL,
    "phone_raw" VARCHAR(32) NOT NULL,
    "email" CITEXT,
    "first_name" VARCHAR(120),
    "last_name" VARCHAR(120),
    "full_name" VARCHAR(240) NOT NULL,
    "company_name" VARCHAR(180),
    "city" VARCHAR(120),
    "preferred_language" VARCHAR(8) NOT NULL DEFAULT 'en',
    "is_do_not_contact" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "erased_at" TIMESTAMPTZ(6),

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_consents" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "contact_id" UUID NOT NULL,
    "purpose" "consent_purpose" NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "source" VARCHAR(96) NOT NULL,
    "policy_version" VARCHAR(32),
    "ip_address" INET,
    "granted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withdrawn_at" TIMESTAMPTZ(6),

    CONSTRAINT "contact_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_sources" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "slug" VARCHAR(64) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "channel" VARCHAR(48),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "lead_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_pipelines" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "slug" VARCHAR(64) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "lead_pipelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_stages" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "pipeline_id" UUID NOT NULL,
    "slug" VARCHAR(64) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_won" BOOLEAN NOT NULL DEFAULT false,
    "is_lost" BOOLEAN NOT NULL DEFAULT false,
    "probability" SMALLINT,

    CONSTRAINT "lead_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "reference" VARCHAR(24) NOT NULL,
    "contact_id" UUID NOT NULL,
    "visitor_id" UUID,
    "source_id" UUID NOT NULL,
    "stage_id" UUID NOT NULL,
    "project_id" UUID,
    "unit_type_id" UUID,
    "owner_id" UUID,
    "message" TEXT,
    "budget_min_minor" BIGINT,
    "budget_max_minor" BIGINT,
    "score" SMALLINT NOT NULL DEFAULT 0,
    "priority" VARCHAR(16),
    "is_qualified" BOOLEAN NOT NULL DEFAULT false,
    "utm_source" VARCHAR(120),
    "utm_medium" VARCHAR(120),
    "utm_campaign" VARCHAR(160),
    "utm_term" VARCHAR(160),
    "landing_page" TEXT,
    "referrer" TEXT,
    "ip_address" INET,
    "first_responded_at" TIMESTAMPTZ(6),
    "last_activity_at" TIMESTAMPTZ(6),
    "next_follow_up_at" TIMESTAMPTZ(6),
    "closed_at" TIMESTAMPTZ(6),
    "lost_reason" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_activities" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "lead_id" UUID NOT NULL,
    "user_id" UUID,
    "type" "activity_type" NOT NULL,
    "subject" VARCHAR(240),
    "body" TEXT,
    "metadata" JSONB,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_assignments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "lead_id" UUID NOT NULL,
    "assigned_to_id" UUID NOT NULL,
    "assigned_by_id" UUID,
    "reason" VARCHAR(255),
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unassigned_at" TIMESTAMPTZ(6),

    CONSTRAINT "lead_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_messages" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "contact_id" UUID,
    "name" VARCHAR(240) NOT NULL,
    "email" CITEXT,
    "phone" VARCHAR(32),
    "subject" VARCHAR(240),
    "message" TEXT NOT NULL,
    "page_url" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ(6),
    "responded_at" TIMESTAMPTZ(6),
    "lead_id" UUID,
    "ip_address" INET,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "callback_requests" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "contact_id" UUID,
    "lead_id" UUID,
    "conversation_id" UUID,
    "name" VARCHAR(240) NOT NULL,
    "phone" VARCHAR(32) NOT NULL,
    "preferred_time_label" VARCHAR(96) NOT NULL,
    "preferred_from" TIMESTAMPTZ(6),
    "preferred_to" TIMESTAMPTZ(6),
    "message" TEXT,
    "unanswered_question" TEXT,
    "status" VARCHAR(32) NOT NULL DEFAULT 'new',
    "handled_by_id" UUID,
    "handled_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "callback_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_visits" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "lead_id" UUID,
    "contact_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "host_id" UUID,
    "status" "visit_status" NOT NULL DEFAULT 'REQUESTED',
    "scheduled_for" TIMESTAMPTZ(6) NOT NULL,
    "duration_minutes" SMALLINT NOT NULL DEFAULT 60,
    "attendee_count" SMALLINT NOT NULL DEFAULT 1,
    "transport_required" BOOLEAN NOT NULL DEFAULT false,
    "meeting_point" VARCHAR(255),
    "outcome" TEXT,
    "feedback_rating" SMALLINT,
    "cancelled_reason" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "site_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorite_projects" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "visitor_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "note" VARCHAR(400),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comparison_sets" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "visitor_id" UUID NOT NULL,
    "name" VARCHAR(140),
    "share_token" VARCHAR(32),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "comparison_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comparison_set_items" (
    "set_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "comparison_set_items_pkey" PRIMARY KEY ("set_id","project_id")
);

-- CreateTable
CREATE TABLE "saved_searches" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "visitor_id" UUID,
    "contact_id" UUID,
    "name" VARCHAR(140) NOT NULL,
    "criteria" JSONB NOT NULL,
    "result_count_at_save" INTEGER,
    "alerts_enabled" BOOLEAN NOT NULL DEFAULT false,
    "alert_frequency" VARCHAR(16) NOT NULL DEFAULT 'weekly',
    "last_run_at" TIMESTAMPTZ(6),
    "last_notified_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_search_alerts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "saved_search_id" UUID NOT NULL,
    "matched_project_ids" UUID[],
    "sent_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_search_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_views" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "project_id" UUID NOT NULL,
    "visitor_id" UUID,
    "source" VARCHAR(48),
    "dwell_ms" INTEGER,
    "viewed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_conversations" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "visitor_id" UUID,
    "lead_id" UUID,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ(6),
    "message_count" SMALLINT NOT NULL DEFAULT 0,
    "unanswered_count" SMALLINT NOT NULL DEFAULT 0,
    "did_escalate" BOOLEAN NOT NULL DEFAULT false,
    "landing_page" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "chat_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "conversation_id" UUID NOT NULL,
    "role" "chat_role" NOT NULL,
    "sequence" SMALLINT NOT NULL,
    "content" TEXT NOT NULL,
    "matched_intent" VARCHAR(64),
    "was_unanswered" BOOLEAN NOT NULL DEFAULT false,
    "suggested_project_ids" UUID[],
    "latency_ms" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_feedback" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "message_id" UUID NOT NULL,
    "rating" "feedback_rating" NOT NULL,
    "reason" VARCHAR(400),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unanswered_queries" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "conversation_id" UUID,
    "query_text" TEXT NOT NULL,
    "normalized_text" VARCHAR(500) NOT NULL,
    "occurrence_count" INTEGER NOT NULL DEFAULT 1,
    "resolved_intent_id" UUID,
    "resolved_at" TIMESTAMPTZ(6),
    "resolved_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unanswered_queries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatbot_intents" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "slug" VARCHAR(64) NOT NULL,
    "name" VARCHAR(140) NOT NULL,
    "patterns" TEXT[],
    "response_text" TEXT NOT NULL,
    "actions" JSONB,
    "priority" SMALLINT NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "chatbot_intents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authors" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "user_id" UUID,
    "slug" VARCHAR(140) NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "title" VARCHAR(160),
    "bio" TEXT,
    "avatar_media_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "authors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_categories" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "slug" VARCHAR(120) NOT NULL,
    "name" VARCHAR(140) NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "blog_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "slug" VARCHAR(180) NOT NULL,
    "title" VARCHAR(260) NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "content_text" TEXT,
    "category_id" UUID,
    "author_id" UUID,
    "cover_media_id" UUID,
    "read_time_minutes" SMALLINT,
    "publish_status" "publish_status" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMPTZ(6),
    "scheduled_for" TIMESTAMPTZ(6),
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "search_vector" tsvector,
    "created_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "slug" VARCHAR(96) NOT NULL,
    "name" VARCHAR(120) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_post_tags" (
    "post_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "blog_post_tags_pkey" PRIMARY KEY ("post_id","tag_id")
);

-- CreateTable
CREATE TABLE "testimonials" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "author_name" VARCHAR(180) NOT NULL,
    "author_role" VARCHAR(140),
    "project_id" UUID,
    "rating" SMALLINT NOT NULL,
    "quote" TEXT NOT NULL,
    "is_video" BOOLEAN NOT NULL DEFAULT false,
    "video_media_id" UUID,
    "video_url" TEXT,
    "avatar_media_id" UUID,
    "publish_status" "publish_status" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMPTZ(6),
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "collected_on" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faq_categories" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "slug" VARCHAR(96) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "faq_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faqs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "category_id" UUID,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "project_id" UUID,
    "publish_status" "publish_status" NOT NULL DEFAULT 'PUBLISHED',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "helpful_count" INTEGER NOT NULL DEFAULT 0,
    "search_vector" tsvector,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "slug" VARCHAR(96) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "slug" VARCHAR(180) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "department_id" UUID,
    "employment_type" VARCHAR(32) NOT NULL,
    "location_text" VARCHAR(160) NOT NULL,
    "is_remote" BOOLEAN NOT NULL DEFAULT false,
    "experience_label" VARCHAR(96),
    "experience_min_years" SMALLINT,
    "experience_max_years" SMALLINT,
    "salary_min_minor" BIGINT,
    "salary_max_minor" BIGINT,
    "salary_is_public" BOOLEAN NOT NULL DEFAULT false,
    "summary" TEXT NOT NULL,
    "responsibilities" TEXT[],
    "requirements" TEXT[],
    "benefits" TEXT[],
    "openings" SMALLINT NOT NULL DEFAULT 1,
    "publish_status" "publish_status" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMPTZ(6),
    "closes_on" DATE,
    "hiring_manager_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_applications" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "reference" VARCHAR(24) NOT NULL,
    "job_id" UUID NOT NULL,
    "contact_id" UUID,
    "full_name" VARCHAR(240) NOT NULL,
    "email" CITEXT NOT NULL,
    "phone" VARCHAR(32) NOT NULL,
    "resume_media_id" UUID,
    "cover_letter" TEXT,
    "portfolio_url" TEXT,
    "linkedin_url" TEXT,
    "current_company" VARCHAR(180),
    "current_ctc_minor" BIGINT,
    "expected_ctc_minor" BIGINT,
    "notice_period_days" SMALLINT,
    "status" "application_status" NOT NULL DEFAULT 'RECEIVED',
    "rating" SMALLINT,
    "reviewer_id" UUID,
    "internal_notes" TEXT,
    "source" VARCHAR(64),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_stage_history" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "application_id" UUID NOT NULL,
    "from_status" "application_status",
    "to_status" "application_status" NOT NULL,
    "changed_by_id" UUID,
    "note" TEXT,
    "changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_stage_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leadership_members" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "slug" VARCHAR(140) NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "role" VARCHAR(180) NOT NULL,
    "bio" TEXT NOT NULL,
    "photo_media_id" UUID,
    "linkedin_url" TEXT,
    "email" CITEXT,
    "publish_status" "publish_status" NOT NULL DEFAULT 'PUBLISHED',
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "leadership_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "year" VARCHAR(12) NOT NULL,
    "occurred_on" DATE,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "value_pillars" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "slug" VARCHAR(96) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "description" TEXT NOT NULL,
    "icon_name" VARCHAR(64),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "value_pillars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_stats" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "slug" VARCHAR(96) NOT NULL,
    "label" VARCHAR(160) NOT NULL,
    "value" INTEGER NOT NULL,
    "suffix" VARCHAR(16),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "company_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_documents" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "slug" VARCHAR(96) NOT NULL,
    "version" VARCHAR(32) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "effective_from" DATE NOT NULL,
    "publish_status" "publish_status" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legal_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_document_sections" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "document_id" UUID NOT NULL,
    "heading" VARCHAR(240) NOT NULL,
    "body" TEXT NOT NULL,
    "items" TEXT[],
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "legal_document_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homepage_sections" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "key" VARCHAR(64) NOT NULL,
    "name" VARCHAR(140) NOT NULL,
    "component_type" VARCHAR(64) NOT NULL,
    "config" JSONB NOT NULL,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "publish_status" "publish_status" NOT NULL DEFAULT 'PUBLISHED',
    "updated_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "homepage_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "navigation_menus" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "slug" VARCHAR(64) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "location" VARCHAR(32) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "navigation_menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "navigation_items" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "menu_id" UUID NOT NULL,
    "parent_id" UUID,
    "label" VARCHAR(120) NOT NULL,
    "href" VARCHAR(500) NOT NULL,
    "target" VARCHAR(16),
    "icon_name" VARCHAR(64),
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "requires_permission" VARCHAR(96),
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "navigation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seo_settings" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "path" VARCHAR(500),
    "project_id" UUID,
    "blog_post_id" UUID,
    "meta_title" VARCHAR(240),
    "meta_description" VARCHAR(500),
    "canonical_url" TEXT,
    "og_title" VARCHAR(240),
    "og_description" VARCHAR(500),
    "og_image_media_id" UUID,
    "twitter_card" VARCHAR(32),
    "no_index" BOOLEAN NOT NULL DEFAULT false,
    "no_follow" BOOLEAN NOT NULL DEFAULT false,
    "structured_data" JSONB,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "seo_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redirects" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "from_path" VARCHAR(500) NOT NULL,
    "to_path" VARCHAR(500) NOT NULL,
    "status_code" SMALLINT NOT NULL DEFAULT 301,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "hit_count" INTEGER NOT NULL DEFAULT 0,
    "last_hit_at" TIMESTAMPTZ(6),
    "note" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "redirects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "key" VARCHAR(120) NOT NULL,
    "value" TEXT,
    "value_json" JSONB,
    "type" "setting_type" NOT NULL DEFAULT 'STRING',
    "group" VARCHAR(64) NOT NULL,
    "label" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "is_secret" BOOLEAN NOT NULL DEFAULT false,
    "updated_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_links" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "platform" VARCHAR(48) NOT NULL,
    "label" VARCHAR(96) NOT NULL,
    "url" TEXT NOT NULL,
    "icon_name" VARCHAR(64),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "social_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offices" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "slug" VARCHAR(96) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "type" VARCHAR(32) NOT NULL,
    "address_line1" VARCHAR(255) NOT NULL,
    "address_line2" VARCHAR(255),
    "city" VARCHAR(120) NOT NULL,
    "state" VARCHAR(120) NOT NULL,
    "pin_code" VARCHAR(10) NOT NULL,
    "phone" VARCHAR(32),
    "email" CITEXT,
    "whatsapp" VARCHAR(20),
    "maps_url" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "opening_hours" JSONB,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "offices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integrations" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "slug" VARCHAR(64) NOT NULL,
    "name" VARCHAR(140) NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB,
    "encrypted_secrets" BYTEA,
    "last_synced_at" TIMESTAMPTZ(6),
    "last_error" TEXT,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "key" VARCHAR(96) NOT NULL,
    "description" TEXT,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "rollout_percent" SMALLINT NOT NULL DEFAULT 0,
    "environments" TEXT[],
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_revisions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "entity_type" VARCHAR(64) NOT NULL,
    "entity_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "change_note" VARCHAR(255),
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "user_id" UUID,
    "type" VARCHAR(64) NOT NULL,
    "title" VARCHAR(240) NOT NULL,
    "body" TEXT,
    "entity_type" VARCHAR(64),
    "entity_id" UUID,
    "action_url" TEXT,
    "priority" VARCHAR(16) NOT NULL DEFAULT 'normal',
    "read_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_deliveries" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "notification_id" UUID NOT NULL,
    "channel" "notification_channel" NOT NULL,
    "status" "delivery_status" NOT NULL DEFAULT 'PENDING',
    "destination" VARCHAR(255),
    "provider_message_id" VARCHAR(180),
    "attempts" SMALLINT NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "sent_at" TIMESTAMPTZ(6),
    "delivered_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "user_id" UUID NOT NULL,
    "type" VARCHAR(64) NOT NULL,
    "channel" "notification_channel" NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_status_deleted_at_idx" ON "users"("status", "deleted_at");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "roles_slug_key" ON "roles"("slug");

-- CreateIndex
CREATE INDEX "roles_parent_role_id_idx" ON "roles"("parent_role_id");

-- CreateIndex
CREATE INDEX "permissions_resource_idx" ON "permissions"("resource");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_resource_action_key" ON "permissions"("resource", "action");

-- CreateIndex
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions"("permission_id");

-- CreateIndex
CREATE INDEX "user_roles_role_id_idx" ON "user_roles"("role_id");

-- CreateIndex
CREATE INDEX "user_roles_expires_at_idx" ON "user_roles"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_revoked_at_idx" ON "sessions"("user_id", "revoked_at");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");

-- CreateIndex
CREATE INDEX "password_reset_tokens_expires_at_idx" ON "password_reset_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "login_attempts_email_attempted_at_idx" ON "login_attempts"("email", "attempted_at");

-- CreateIndex
CREATE INDEX "login_attempts_ip_address_attempted_at_idx" ON "login_attempts"("ip_address", "attempted_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_created_at_idx" ON "audit_logs"("entity_type", "entity_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "audit_logs"("actor_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_prefix_key" ON "api_keys"("key_prefix");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "api_keys"("key_hash");

-- CreateIndex
CREATE INDEX "api_keys_revoked_at_idx" ON "api_keys"("revoked_at");

-- CreateIndex
CREATE UNIQUE INDEX "projects_slug_key" ON "projects"("slug");

-- CreateIndex
CREATE INDEX "projects_publish_status_deleted_at_idx" ON "projects"("publish_status", "deleted_at");

-- CreateIndex
CREATE INDEX "projects_category_id_publish_status_idx" ON "projects"("category_id", "publish_status");

-- CreateIndex
CREATE INDEX "projects_location_id_idx" ON "projects"("location_id");

-- CreateIndex
CREATE INDEX "projects_project_status_id_idx" ON "projects"("project_status_id");

-- CreateIndex
CREATE INDEX "projects_price_from_minor_idx" ON "projects"("price_from_minor");

-- CreateIndex
CREATE INDEX "projects_possession_on_idx" ON "projects"("possession_on");

-- CreateIndex
CREATE INDEX "projects_is_featured_featured_rank_idx" ON "projects"("is_featured", "featured_rank");

-- CreateIndex
CREATE INDEX "projects_deleted_at_idx" ON "projects"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "project_categories_slug_key" ON "project_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "project_categories_name_key" ON "project_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "project_statuses_slug_key" ON "project_statuses"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "project_statuses_name_key" ON "project_statuses"("name");

-- CreateIndex
CREATE UNIQUE INDEX "locations_slug_key" ON "locations"("slug");

-- CreateIndex
CREATE INDEX "locations_type_idx" ON "locations"("type");

-- CreateIndex
CREATE INDEX "locations_parent_id_idx" ON "locations"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "locations_parent_id_name_key" ON "locations"("parent_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "amenity_groups_slug_key" ON "amenity_groups"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "amenity_groups_name_key" ON "amenity_groups"("name");

-- CreateIndex
CREATE UNIQUE INDEX "amenities_slug_key" ON "amenities"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "amenities_name_key" ON "amenities"("name");

-- CreateIndex
CREATE INDEX "amenities_group_id_idx" ON "amenities"("group_id");

-- CreateIndex
CREATE INDEX "project_amenities_amenity_id_idx" ON "project_amenities"("amenity_id");

-- CreateIndex
CREATE UNIQUE INDEX "unit_configurations_slug_key" ON "unit_configurations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "unit_configurations_name_key" ON "unit_configurations"("name");

-- CreateIndex
CREATE INDEX "project_unit_types_project_id_is_available_idx" ON "project_unit_types"("project_id", "is_available");

-- CreateIndex
CREATE INDEX "project_unit_types_configuration_id_idx" ON "project_unit_types"("configuration_id");

-- CreateIndex
CREATE INDEX "project_unit_types_price_minor_idx" ON "project_unit_types"("price_minor");

-- CreateIndex
CREATE UNIQUE INDEX "project_unit_types_project_id_configuration_id_label_key" ON "project_unit_types"("project_id", "configuration_id", "label");

-- CreateIndex
CREATE INDEX "floor_plans_unit_type_id_idx" ON "floor_plans"("unit_type_id");

-- CreateIndex
CREATE INDEX "nearby_places_project_id_category_idx" ON "nearby_places"("project_id", "category");

-- CreateIndex
CREATE INDEX "construction_updates_project_id_captured_on_idx" ON "construction_updates"("project_id", "captured_on");

-- CreateIndex
CREATE INDEX "construction_updates_publish_status_idx" ON "construction_updates"("publish_status");

-- CreateIndex
CREATE INDEX "rera_registrations_registration_number_idx" ON "rera_registrations"("registration_number");

-- CreateIndex
CREATE UNIQUE INDEX "rera_registrations_project_id_registration_number_key" ON "rera_registrations"("project_id", "registration_number");

-- CreateIndex
CREATE INDEX "project_price_history_project_id_effective_from_idx" ON "project_price_history"("project_id", "effective_from");

-- CreateIndex
CREATE INDEX "virtual_tours_project_id_is_active_idx" ON "virtual_tours"("project_id", "is_active");

-- CreateIndex
CREATE INDEX "project_assignments_user_id_idx" ON "project_assignments"("user_id");

-- CreateIndex
CREATE INDEX "media_folders_path_idx" ON "media_folders"("path");

-- CreateIndex
CREATE UNIQUE INDEX "media_folders_parent_id_slug_key" ON "media_folders"("parent_id", "slug");

-- CreateIndex
CREATE INDEX "media_assets_kind_deleted_at_idx" ON "media_assets"("kind", "deleted_at");

-- CreateIndex
CREATE INDEX "media_assets_folder_id_idx" ON "media_assets"("folder_id");

-- CreateIndex
CREATE INDEX "media_assets_checksum_sha256_idx" ON "media_assets"("checksum_sha256");

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_bucket_storage_path_key" ON "media_assets"("bucket", "storage_path");

-- CreateIndex
CREATE UNIQUE INDEX "media_variants_media_id_label_format_key" ON "media_variants"("media_id", "label", "format");

-- CreateIndex
CREATE INDEX "project_media_project_id_role_sort_order_idx" ON "project_media"("project_id", "role", "sort_order");

-- CreateIndex
CREATE INDEX "project_media_media_id_idx" ON "project_media"("media_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_media_project_id_media_id_role_key" ON "project_media"("project_id", "media_id", "role");

-- CreateIndex
CREATE INDEX "project_documents_project_id_kind_is_active_idx" ON "project_documents"("project_id", "kind", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "galleries_slug_key" ON "galleries"("slug");

-- CreateIndex
CREATE INDEX "gallery_items_gallery_id_sort_order_idx" ON "gallery_items"("gallery_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "gallery_items_gallery_id_media_id_key" ON "gallery_items"("gallery_id", "media_id");

-- CreateIndex
CREATE UNIQUE INDEX "visitors_anonymous_id_key" ON "visitors"("anonymous_id");

-- CreateIndex
CREATE INDEX "visitors_contact_id_idx" ON "visitors"("contact_id");

-- CreateIndex
CREATE INDEX "visitors_last_seen_at_idx" ON "visitors"("last_seen_at");

-- CreateIndex
CREATE UNIQUE INDEX "contacts_phone_normalized_key" ON "contacts"("phone_normalized");

-- CreateIndex
CREATE INDEX "contacts_email_idx" ON "contacts"("email");

-- CreateIndex
CREATE INDEX "contacts_full_name_idx" ON "contacts"("full_name");

-- CreateIndex
CREATE INDEX "contacts_created_at_idx" ON "contacts"("created_at");

-- CreateIndex
CREATE INDEX "contact_consents_contact_id_purpose_idx" ON "contact_consents"("contact_id", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "lead_sources_slug_key" ON "lead_sources"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "lead_sources_name_key" ON "lead_sources"("name");

-- CreateIndex
CREATE UNIQUE INDEX "lead_pipelines_slug_key" ON "lead_pipelines"("slug");

-- CreateIndex
CREATE INDEX "lead_stages_pipeline_id_sort_order_idx" ON "lead_stages"("pipeline_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "lead_stages_pipeline_id_slug_key" ON "lead_stages"("pipeline_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "leads_reference_key" ON "leads"("reference");

-- CreateIndex
CREATE INDEX "leads_stage_id_created_at_idx" ON "leads"("stage_id", "created_at");

-- CreateIndex
CREATE INDEX "leads_owner_id_stage_id_idx" ON "leads"("owner_id", "stage_id");

-- CreateIndex
CREATE INDEX "leads_project_id_idx" ON "leads"("project_id");

-- CreateIndex
CREATE INDEX "leads_contact_id_idx" ON "leads"("contact_id");

-- CreateIndex
CREATE INDEX "leads_created_at_idx" ON "leads"("created_at");

-- CreateIndex
CREATE INDEX "leads_next_follow_up_at_idx" ON "leads"("next_follow_up_at");

-- CreateIndex
CREATE INDEX "leads_deleted_at_idx" ON "leads"("deleted_at");

-- CreateIndex
CREATE INDEX "lead_activities_lead_id_occurred_at_idx" ON "lead_activities"("lead_id", "occurred_at");

-- CreateIndex
CREATE INDEX "lead_activities_user_id_occurred_at_idx" ON "lead_activities"("user_id", "occurred_at");

-- CreateIndex
CREATE INDEX "lead_assignments_lead_id_assigned_at_idx" ON "lead_assignments"("lead_id", "assigned_at");

-- CreateIndex
CREATE INDEX "lead_assignments_assigned_to_id_idx" ON "lead_assignments"("assigned_to_id");

-- CreateIndex
CREATE INDEX "contact_messages_is_read_created_at_idx" ON "contact_messages"("is_read", "created_at");

-- CreateIndex
CREATE INDEX "contact_messages_contact_id_idx" ON "contact_messages"("contact_id");

-- CreateIndex
CREATE INDEX "callback_requests_status_created_at_idx" ON "callback_requests"("status", "created_at");

-- CreateIndex
CREATE INDEX "callback_requests_contact_id_idx" ON "callback_requests"("contact_id");

-- CreateIndex
CREATE INDEX "site_visits_scheduled_for_status_idx" ON "site_visits"("scheduled_for", "status");

-- CreateIndex
CREATE INDEX "site_visits_project_id_scheduled_for_idx" ON "site_visits"("project_id", "scheduled_for");

-- CreateIndex
CREATE INDEX "site_visits_host_id_scheduled_for_idx" ON "site_visits"("host_id", "scheduled_for");

-- CreateIndex
CREATE INDEX "favorite_projects_project_id_idx" ON "favorite_projects"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_projects_visitor_id_project_id_key" ON "favorite_projects"("visitor_id", "project_id");

-- CreateIndex
CREATE UNIQUE INDEX "comparison_sets_share_token_key" ON "comparison_sets"("share_token");

-- CreateIndex
CREATE INDEX "comparison_sets_visitor_id_idx" ON "comparison_sets"("visitor_id");

-- CreateIndex
CREATE INDEX "comparison_set_items_project_id_idx" ON "comparison_set_items"("project_id");

-- CreateIndex
CREATE INDEX "saved_searches_visitor_id_idx" ON "saved_searches"("visitor_id");

-- CreateIndex
CREATE INDEX "saved_searches_alerts_enabled_last_run_at_idx" ON "saved_searches"("alerts_enabled", "last_run_at");

-- CreateIndex
CREATE INDEX "saved_search_alerts_saved_search_id_created_at_idx" ON "saved_search_alerts"("saved_search_id", "created_at");

-- CreateIndex
CREATE INDEX "project_views_project_id_viewed_at_idx" ON "project_views"("project_id", "viewed_at");

-- CreateIndex
CREATE INDEX "project_views_visitor_id_viewed_at_idx" ON "project_views"("visitor_id", "viewed_at");

-- CreateIndex
CREATE UNIQUE INDEX "chat_conversations_lead_id_key" ON "chat_conversations"("lead_id");

-- CreateIndex
CREATE INDEX "chat_conversations_visitor_id_started_at_idx" ON "chat_conversations"("visitor_id", "started_at");

-- CreateIndex
CREATE INDEX "chat_conversations_started_at_idx" ON "chat_conversations"("started_at");

-- CreateIndex
CREATE INDEX "chat_conversations_did_escalate_idx" ON "chat_conversations"("did_escalate");

-- CreateIndex
CREATE INDEX "chat_messages_conversation_id_created_at_idx" ON "chat_messages"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "chat_messages_was_unanswered_idx" ON "chat_messages"("was_unanswered");

-- CreateIndex
CREATE UNIQUE INDEX "chat_messages_conversation_id_sequence_key" ON "chat_messages"("conversation_id", "sequence");

-- CreateIndex
CREATE INDEX "chat_feedback_message_id_idx" ON "chat_feedback"("message_id");

-- CreateIndex
CREATE INDEX "chat_feedback_rating_created_at_idx" ON "chat_feedback"("rating", "created_at");

-- CreateIndex
CREATE INDEX "unanswered_queries_normalized_text_idx" ON "unanswered_queries"("normalized_text");

-- CreateIndex
CREATE INDEX "unanswered_queries_resolved_at_occurrence_count_idx" ON "unanswered_queries"("resolved_at", "occurrence_count");

-- CreateIndex
CREATE UNIQUE INDEX "chatbot_intents_slug_key" ON "chatbot_intents"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "authors_user_id_key" ON "authors"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "authors_slug_key" ON "authors"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "blog_categories_slug_key" ON "blog_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "blog_categories_name_key" ON "blog_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");

-- CreateIndex
CREATE INDEX "blog_posts_publish_status_published_at_idx" ON "blog_posts"("publish_status", "published_at");

-- CreateIndex
CREATE INDEX "blog_posts_category_id_publish_status_idx" ON "blog_posts"("category_id", "publish_status");

-- CreateIndex
CREATE INDEX "blog_posts_author_id_idx" ON "blog_posts"("author_id");

-- CreateIndex
CREATE INDEX "blog_posts_deleted_at_idx" ON "blog_posts"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE INDEX "blog_post_tags_tag_id_idx" ON "blog_post_tags"("tag_id");

-- CreateIndex
CREATE INDEX "testimonials_publish_status_sort_order_idx" ON "testimonials"("publish_status", "sort_order");

-- CreateIndex
CREATE INDEX "testimonials_project_id_idx" ON "testimonials"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "faq_categories_slug_key" ON "faq_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "faq_categories_name_key" ON "faq_categories"("name");

-- CreateIndex
CREATE INDEX "faqs_category_id_sort_order_idx" ON "faqs"("category_id", "sort_order");

-- CreateIndex
CREATE INDEX "faqs_publish_status_idx" ON "faqs"("publish_status");

-- CreateIndex
CREATE UNIQUE INDEX "departments_slug_key" ON "departments"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_slug_key" ON "jobs"("slug");

-- CreateIndex
CREATE INDEX "jobs_publish_status_published_at_idx" ON "jobs"("publish_status", "published_at");

-- CreateIndex
CREATE INDEX "jobs_department_id_idx" ON "jobs"("department_id");

-- CreateIndex
CREATE UNIQUE INDEX "job_applications_reference_key" ON "job_applications"("reference");

-- CreateIndex
CREATE INDEX "job_applications_job_id_status_idx" ON "job_applications"("job_id", "status");

-- CreateIndex
CREATE INDEX "job_applications_status_created_at_idx" ON "job_applications"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "job_applications_job_id_email_key" ON "job_applications"("job_id", "email");

-- CreateIndex
CREATE INDEX "application_stage_history_application_id_changed_at_idx" ON "application_stage_history"("application_id", "changed_at");

-- CreateIndex
CREATE UNIQUE INDEX "leadership_members_slug_key" ON "leadership_members"("slug");

-- CreateIndex
CREATE INDEX "leadership_members_publish_status_sort_order_idx" ON "leadership_members"("publish_status", "sort_order");

-- CreateIndex
CREATE INDEX "milestones_sort_order_idx" ON "milestones"("sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "value_pillars_slug_key" ON "value_pillars"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "company_stats_slug_key" ON "company_stats"("slug");

-- CreateIndex
CREATE INDEX "legal_documents_slug_effective_from_idx" ON "legal_documents"("slug", "effective_from");

-- CreateIndex
CREATE UNIQUE INDEX "legal_documents_slug_version_key" ON "legal_documents"("slug", "version");

-- CreateIndex
CREATE INDEX "legal_document_sections_document_id_sort_order_idx" ON "legal_document_sections"("document_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "homepage_sections_key_key" ON "homepage_sections"("key");

-- CreateIndex
CREATE INDEX "homepage_sections_is_visible_sort_order_idx" ON "homepage_sections"("is_visible", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "navigation_menus_slug_key" ON "navigation_menus"("slug");

-- CreateIndex
CREATE INDEX "navigation_items_menu_id_parent_id_sort_order_idx" ON "navigation_items"("menu_id", "parent_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "seo_settings_path_key" ON "seo_settings"("path");

-- CreateIndex
CREATE UNIQUE INDEX "seo_settings_project_id_key" ON "seo_settings"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "seo_settings_blog_post_id_key" ON "seo_settings"("blog_post_id");

-- CreateIndex
CREATE UNIQUE INDEX "redirects_from_path_key" ON "redirects"("from_path");

-- CreateIndex
CREATE INDEX "redirects_is_active_idx" ON "redirects"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "site_settings_key_key" ON "site_settings"("key");

-- CreateIndex
CREATE INDEX "site_settings_group_is_public_idx" ON "site_settings"("group", "is_public");

-- CreateIndex
CREATE UNIQUE INDEX "social_links_platform_key" ON "social_links"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "offices_slug_key" ON "offices"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "integrations_slug_key" ON "integrations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_key_key" ON "feature_flags"("key");

-- CreateIndex
CREATE INDEX "content_revisions_entity_type_entity_id_created_at_idx" ON "content_revisions"("entity_type", "entity_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "content_revisions_entity_type_entity_id_version_key" ON "content_revisions"("entity_type", "entity_id", "version");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_created_at_idx" ON "notifications"("user_id", "read_at", "created_at");

-- CreateIndex
CREATE INDEX "notifications_type_created_at_idx" ON "notifications"("type", "created_at");

-- CreateIndex
CREATE INDEX "notification_deliveries_status_created_at_idx" ON "notification_deliveries"("status", "created_at");

-- CreateIndex
CREATE INDEX "notification_deliveries_notification_id_idx" ON "notification_deliveries"("notification_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_type_channel_key" ON "notification_preferences"("user_id", "type", "channel");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_avatar_media_id_fkey" FOREIGN KEY ("avatar_media_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_parent_role_id_fkey" FOREIGN KEY ("parent_role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "project_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_project_status_id_fkey" FOREIGN KEY ("project_status_id") REFERENCES "project_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amenities" ADD CONSTRAINT "amenities_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "amenity_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_amenities" ADD CONSTRAINT "project_amenities_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_amenities" ADD CONSTRAINT "project_amenities_amenity_id_fkey" FOREIGN KEY ("amenity_id") REFERENCES "amenities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_unit_types" ADD CONSTRAINT "project_unit_types_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_unit_types" ADD CONSTRAINT "project_unit_types_configuration_id_fkey" FOREIGN KEY ("configuration_id") REFERENCES "unit_configurations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "floor_plans" ADD CONSTRAINT "floor_plans_unit_type_id_fkey" FOREIGN KEY ("unit_type_id") REFERENCES "project_unit_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "floor_plans" ADD CONSTRAINT "floor_plans_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nearby_places" ADD CONSTRAINT "nearby_places_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construction_updates" ADD CONSTRAINT "construction_updates_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construction_update_media" ADD CONSTRAINT "construction_update_media_update_id_fkey" FOREIGN KEY ("update_id") REFERENCES "construction_updates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construction_update_media" ADD CONSTRAINT "construction_update_media_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rera_registrations" ADD CONSTRAINT "rera_registrations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rera_registrations" ADD CONSTRAINT "rera_registrations_certificate_media_id_fkey" FOREIGN KEY ("certificate_media_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_price_history" ADD CONSTRAINT "project_price_history_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_price_history" ADD CONSTRAINT "project_price_history_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "virtual_tours" ADD CONSTRAINT "virtual_tours_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "virtual_tours" ADD CONSTRAINT "virtual_tours_unit_type_id_fkey" FOREIGN KEY ("unit_type_id") REFERENCES "project_unit_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "virtual_tours" ADD CONSTRAINT "virtual_tours_thumbnail_media_id_fkey" FOREIGN KEY ("thumbnail_media_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_folders" ADD CONSTRAINT "media_folders_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "media_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "media_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_variants" ADD CONSTRAINT "media_variants_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_media" ADD CONSTRAINT "project_media_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_media" ADD CONSTRAINT "project_media_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_documents" ADD CONSTRAINT "project_documents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_documents" ADD CONSTRAINT "project_documents_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery_items" ADD CONSTRAINT "gallery_items_gallery_id_fkey" FOREIGN KEY ("gallery_id") REFERENCES "galleries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery_items" ADD CONSTRAINT "gallery_items_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_consents" ADD CONSTRAINT "contact_consents_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_stages" ADD CONSTRAINT "lead_stages_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "lead_pipelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_visitor_id_fkey" FOREIGN KEY ("visitor_id") REFERENCES "visitors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "lead_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "lead_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_assignments" ADD CONSTRAINT "lead_assignments_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_assignments" ADD CONSTRAINT "lead_assignments_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_assignments" ADD CONSTRAINT "lead_assignments_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_messages" ADD CONSTRAINT "contact_messages_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_messages" ADD CONSTRAINT "contact_messages_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "callback_requests" ADD CONSTRAINT "callback_requests_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "callback_requests" ADD CONSTRAINT "callback_requests_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "callback_requests" ADD CONSTRAINT "callback_requests_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "chat_conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "callback_requests" ADD CONSTRAINT "callback_requests_handled_by_id_fkey" FOREIGN KEY ("handled_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_visits" ADD CONSTRAINT "site_visits_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_visits" ADD CONSTRAINT "site_visits_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_visits" ADD CONSTRAINT "site_visits_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_visits" ADD CONSTRAINT "site_visits_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_projects" ADD CONSTRAINT "favorite_projects_visitor_id_fkey" FOREIGN KEY ("visitor_id") REFERENCES "visitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_projects" ADD CONSTRAINT "favorite_projects_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comparison_sets" ADD CONSTRAINT "comparison_sets_visitor_id_fkey" FOREIGN KEY ("visitor_id") REFERENCES "visitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comparison_set_items" ADD CONSTRAINT "comparison_set_items_set_id_fkey" FOREIGN KEY ("set_id") REFERENCES "comparison_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comparison_set_items" ADD CONSTRAINT "comparison_set_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_visitor_id_fkey" FOREIGN KEY ("visitor_id") REFERENCES "visitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_search_alerts" ADD CONSTRAINT "saved_search_alerts_saved_search_id_fkey" FOREIGN KEY ("saved_search_id") REFERENCES "saved_searches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_views" ADD CONSTRAINT "project_views_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_views" ADD CONSTRAINT "project_views_visitor_id_fkey" FOREIGN KEY ("visitor_id") REFERENCES "visitors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_visitor_id_fkey" FOREIGN KEY ("visitor_id") REFERENCES "visitors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "chat_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_feedback" ADD CONSTRAINT "chat_feedback_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unanswered_queries" ADD CONSTRAINT "unanswered_queries_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "chat_conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unanswered_queries" ADD CONSTRAINT "unanswered_queries_resolved_intent_id_fkey" FOREIGN KEY ("resolved_intent_id") REFERENCES "chatbot_intents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unanswered_queries" ADD CONSTRAINT "unanswered_queries_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authors" ADD CONSTRAINT "authors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authors" ADD CONSTRAINT "authors_avatar_media_id_fkey" FOREIGN KEY ("avatar_media_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "blog_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "authors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_cover_media_id_fkey" FOREIGN KEY ("cover_media_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_post_tags" ADD CONSTRAINT "blog_post_tags_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_post_tags" ADD CONSTRAINT "blog_post_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_avatar_media_id_fkey" FOREIGN KEY ("avatar_media_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_video_media_id_fkey" FOREIGN KEY ("video_media_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faqs" ADD CONSTRAINT "faqs_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "faq_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faqs" ADD CONSTRAINT "faqs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_resume_media_id_fkey" FOREIGN KEY ("resume_media_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_stage_history" ADD CONSTRAINT "application_stage_history_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_stage_history" ADD CONSTRAINT "application_stage_history_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leadership_members" ADD CONSTRAINT "leadership_members_photo_media_id_fkey" FOREIGN KEY ("photo_media_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_document_sections" ADD CONSTRAINT "legal_document_sections_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "legal_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "navigation_items" ADD CONSTRAINT "navigation_items_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "navigation_menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "navigation_items" ADD CONSTRAINT "navigation_items_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "navigation_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seo_settings" ADD CONSTRAINT "seo_settings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seo_settings" ADD CONSTRAINT "seo_settings_blog_post_id_fkey" FOREIGN KEY ("blog_post_id") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seo_settings" ADD CONSTRAINT "seo_settings_og_image_media_id_fkey" FOREIGN KEY ("og_image_media_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_revisions" ADD CONSTRAINT "content_revisions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


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
