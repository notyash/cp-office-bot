BEGIN;

INSERT INTO police_stations (
    name,
    code,
    jurisdiction_area,
    address,
    city,
    district,
    state,
    pincode,
    phone_number
)
VALUES
(
    'Central Police Station',
    'PS-CENTRAL',
    'Central city area',
    'Main Road, Central Area',
    'Demo City',
    'Demo District',
    'Maharashtra',
    '000001',
    '+91-0000000001'
),
(
    'North Police Station',
    'PS-NORTH',
    'North zone',
    'North Zone Road',
    'Demo City',
    'Demo District',
    'Maharashtra',
    '000002',
    '+91-0000000002'
),
(
    'South Police Station',
    'PS-SOUTH',
    'South zone',
    'South Zone Road',
    'Demo City',
    'Demo District',
    'Maharashtra',
    '000003',
    '+91-0000000003'
),
(
    'Traffic Police Station',
    'PS-TRAFFIC',
    'Traffic and road complaints',
    'Traffic Control Office',
    'Demo City',
    'Demo District',
    'Maharashtra',
    '000004',
    '+91-0000000004'
)
ON CONFLICT (code) DO UPDATE
SET
    name = EXCLUDED.name,
    jurisdiction_area = EXCLUDED.jurisdiction_area,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    district = EXCLUDED.district,
    state = EXCLUDED.state,
    pincode = EXCLUDED.pincode,
    phone_number = EXCLUDED.phone_number,
    updated_at = NOW();

COMMIT;