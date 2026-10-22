-- Social graph: relationships between users.
-- User ids are MongoDB ObjectIds (24 lowercase hex chars). There is no
-- users table here, so the app removes a user's rows when the account
-- is deleted (see graph.service.deleteUserGraph).

CREATE DOMAIN object_id AS CHAR(24)
  CHECK (VALUE ~ '^[0-9a-f]{24}$');

CREATE TABLE follows (
  follower_id  object_id   NOT NULL,
  following_id object_id   NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);
-- PK covers "who do I follow"; this covers "who follows me".
CREATE INDEX follows_following_idx ON follows (following_id, created_at DESC);

CREATE TABLE blocks (
  blocker_id object_id   NOT NULL,
  blocked_id object_id   NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);
CREATE INDEX blocks_blocked_idx ON blocks (blocked_id);

CREATE TABLE mutes (
  muter_id   object_id   NOT NULL,
  muted_id   object_id   NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (muter_id, muted_id),
  CHECK (muter_id <> muted_id)
);

CREATE TABLE close_friends (
  user_id    object_id   NOT NULL,
  friend_id  object_id   NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, friend_id),
  CHECK (user_id <> friend_id)
);
CREATE INDEX close_friends_friend_idx ON close_friends (friend_id);
