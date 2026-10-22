-- Pending follow requests to private accounts.
CREATE TABLE follow_requests (
  requester_id object_id   NOT NULL,
  target_id    object_id   NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (requester_id, target_id),
  CHECK (requester_id <> target_id)
);
CREATE INDEX follow_requests_target_idx ON follow_requests (target_id, created_at DESC);
