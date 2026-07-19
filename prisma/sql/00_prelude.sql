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
