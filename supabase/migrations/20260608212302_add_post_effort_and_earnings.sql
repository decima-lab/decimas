-- =============================================================================
-- Add effort level + "earn up to" attributes to post
-- =============================================================================
-- These are first-class, sortable product attributes (the public site ranks
-- and filters by them), so they live in dedicated columns rather than in
-- `post.metadata` jsonb — which is reserved for unstructured config (e.g.
-- affiliate tracking) that is never sorted on.
--
--   effort_level        ordinal 1 (lowest effort) .. 5 (highest effort)
--   earn_up_to_amount   best-case earning figure, whole units of the currency
--   earn_up_to_currency ISO 4217 code (e.g. 'USD', 'GBP', 'EUR') for display;
--                       amounts in different currencies are not directly
--                       comparable for cross-currency sorting (deferred).
--
-- All NOT NULL with defaults so every post carries a value and existing rows
-- backfill cleanly: effort defaults to the neutral middle (3), earnings to 0.
-- -----------------------------------------------------------------------------

alter table post
  add column effort_level        smallint not null default 3
                                            check (effort_level between 1 and 5),
  add column earn_up_to_amount   integer  not null default 0
                                            check (earn_up_to_amount >= 0),
  add column earn_up_to_currency text     not null default 'USD'
                                            check (char_length(earn_up_to_currency) = 3);
