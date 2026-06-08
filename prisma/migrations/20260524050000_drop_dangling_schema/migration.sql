-- Phase 10 (TZ §10) — drop schema entities that have no UI/API code path.
--
-- AdminNote: model never read or written from anywhere in src/**. Originally
-- planned for an admin notes UI that never landed.
--
-- ReviewReply: ditto. Seller-side review replies are not implemented; the
-- model only existed to mirror the marketplace UX from the initial design
-- doc. If reintroduced, do so behind a feature flag with proper UI.

DROP TABLE IF EXISTS "AdminNote";
DROP TABLE IF EXISTS "ReviewReply";
