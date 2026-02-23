-- Add shared employee desk account
INSERT INTO admin_users (username, password_hash, full_name, role, email, active)
VALUES ('admin', 'DeltaV2026!', 'Desk Account', 'manager', 'desk@deltavautomotive.co.uk', TRUE)
ON CONFLICT (username) DO UPDATE
SET password_hash = 'DeltaV2026!', full_name = 'Desk Account', role = 'manager', active = TRUE;

-- Verify the account was added
SELECT username, full_name, role, active FROM admin_users WHERE username = 'admin';
