-- Insert 10 projects
INSERT INTO projects (id, name, description, user_id, created_at, updated_at)
VALUES
  ('proj-001', 'Hydroponic Farm A', 'Indoor hydroponic farm for leafy greens', '5c936cad-2f4a-4054-964c-749707bfd38e', NOW() - INTERVAL '3 months', NOW() - INTERVAL '3 months'),
  ('proj-002', 'Smart Garden B', 'Automated garden system with climate control', '5c936cad-2f4a-4054-964c-749707bfd38e', NOW() - INTERVAL '3 months', NOW() - INTERVAL '3 months'),
  ('proj-003', 'Aquaponics System C', 'Combined fish and plant cultivation', '5c936cad-2f4a-4054-964c-749707bfd38e', NOW() - INTERVAL '2.5 months', NOW() - INTERVAL '2.5 months'),
  ('proj-004', 'Vertical Farm D', 'Multi-level indoor farming system', '5c936cad-2f4a-4054-964c-749707bfd38e', NOW() - INTERVAL '2.5 months', NOW() - INTERVAL '2.5 months'),
  ('proj-005', 'Greenhouse E', 'Temperature controlled greenhouse', '5c936cad-2f4a-4054-964c-749707bfd38e', NOW() - INTERVAL '2 months', NOW() - INTERVAL '2 months'),
  ('proj-006', 'Urban Farm F', 'City rooftop hydroponic system', '5c936cad-2f4a-4054-964c-749707bfd38e', NOW() - INTERVAL '2 months', NOW() - INTERVAL '2 months'),
  ('proj-007', 'Research Lab G', 'Experimental hydroponic setup', '5c936cad-2f4a-4054-964c-749707bfd38e', NOW() - INTERVAL '1.5 months', NOW() - INTERVAL '1.5 months'),
  ('proj-008', 'Educational Farm H', 'Teaching facility for hydroponics', '5c936cad-2f4a-4054-964c-749707bfd38e', NOW() - INTERVAL '1 month', NOW() - INTERVAL '1 month'),
  ('proj-009', 'Commercial Farm I', 'Large scale hydroponic production', '5c936cad-2f4a-4054-964c-749707bfd38e', NOW() - INTERVAL '0.5 months', NOW() - INTERVAL '0.5 months'),
  ('proj-010', 'Home Garden J', 'Personal hydroponic garden setup', '5c936cad-2f4a-4054-964c-749707bfd38e', NOW(), NOW());

-- Insert 20 devices (2 devices per project)
INSERT INTO devices (id, name, description, project_id, created_at, updated_at)
SELECT 
  'dev-' || LPAD(CAST(generate_series AS TEXT), 3, '0'),
  'Device ' || CAST(generate_series AS TEXT),
  'Controller unit for various sensors and actuators',
  'proj-' || LPAD(CAST(CEIL(generate_series/2.0) AS TEXT), 3, '0'),
  NOW() - (INTERVAL '3 months' - (INTERVAL '1 day' * (generate_series))),
  NOW() - (INTERVAL '3 months' - (INTERVAL '1 day' * (generate_series)))
FROM generate_series(1, 20);

-- Insert pin types
INSERT INTO data_types (id, name) VALUES
  (1, 'Analog'),
  (2, 'Digital'),
  (3, 'PWM')
ON CONFLICT (id) DO NOTHING;

INSERT INTO signal_types (id, name) VALUES
  (1, 'Voltage'),
  (2, 'Current'),
  (3, 'Temperature'),
  (4, 'Humidity'),
  (5, 'pH'),
  (6, 'EC'),
  (7, 'Light'),
  (8, 'Pressure')
ON CONFLICT (id) DO NOTHING;

INSERT INTO modes (id, type) VALUES
  (1, 'Input'),
  (2, 'Output')
ON CONFLICT (id) DO NOTHING;

-- Insert 3 standard pins
INSERT INTO pins (id, pin_number, pin_name) VALUES
  ('pin-001', 1, 'GPIO1'),
  ('pin-002', 2, 'GPIO2'),
  ('pin-003', 3, 'GPIO3')
ON CONFLICT (id) DO NOTHING;

-- Insert 15 input pins
INSERT INTO pins (id, pin_number, pin_name)
SELECT 
  'pin-in-' || LPAD(CAST(generate_series AS TEXT), 3, '0'),
  generate_series + 3,
  'INPUT_' || CAST(generate_series + 3 AS TEXT)
FROM generate_series(1, 15)
ON CONFLICT (id) DO NOTHING;

-- Insert 15 output pins
INSERT INTO pins (id, pin_number, pin_name)
SELECT 
  'pin-out-' || LPAD(CAST(generate_series AS TEXT), 3, '0'),
  generate_series + 18,
  'OUTPUT_' || CAST(generate_series + 18 AS TEXT)
FROM generate_series(1, 15)
ON CONFLICT (id) DO NOTHING;

-- Insert pin configurations for each device
INSERT INTO pin_configs (id, device_id, pin_id, data_type_id, signal_type_id, mode_id, name, unit, value, last_updated, created_at)
SELECT 
  'cfg-' || LPAD(CAST(row_number() OVER () AS TEXT), 3, '0'),
  'dev-' || LPAD(CAST(CEIL(pin_num/5.0) AS TEXT), 3, '0'),
  CASE 
    WHEN pin_num <= 3 THEN 'pin-00' || pin_num
    WHEN pin_num <= 18 THEN 'pin-in-' || LPAD(CAST(pin_num-3 AS TEXT), 3, '0')
    ELSE 'pin-out-' || LPAD(CAST(pin_num-18 AS TEXT), 3, '0')
  END,
  (pin_num % 3) + 1,
  ((pin_num-1) % 8) + 1,
  CASE WHEN pin_num <= 18 THEN 1 ELSE 2 END,
  CASE 
    WHEN pin_num <= 18 THEN 'Sensor ' || CAST(pin_num AS TEXT)
    ELSE 'Actuator ' || CAST(pin_num-18 AS TEXT)
  END,
  CASE ((pin_num-1) % 8) + 1
    WHEN 1 THEN 'V'
    WHEN 2 THEN 'mA'
    WHEN 3 THEN '°C'
    WHEN 4 THEN '%'
    WHEN 5 THEN 'pH'
    WHEN 6 THEN 'mS/cm'
    WHEN 7 THEN 'lux'
    WHEN 8 THEN 'kPa'
  END,
  CASE 
    WHEN pin_num <= 18 THEN (random() * 100)::TEXT
    ELSE (random() * 1)::INT::TEXT
  END,
  NOW() - (INTERVAL '3 months' - (INTERVAL '1 day' * pin_num)),
  NOW() - (INTERVAL '3 months' - (INTERVAL '1 day' * pin_num))
FROM generate_series(1, 33) pin_num;

-- Insert historical pin data for the last 3 months
INSERT INTO pin_data (id, pin_config_id, value, created_at)
SELECT 
  'data-' || LPAD(CAST(row_number() OVER () AS TEXT), 6, '0'),
  cfg.id,
  CASE 
    WHEN m.type = 'Input' THEN (50 + (random() * 50))::TEXT -- Random value between 50-100 for inputs
    ELSE (random() * 1)::INT::TEXT -- 0 or 1 for outputs
  END,
  timestamp
FROM (
  SELECT generate_series(
    NOW() - INTERVAL '3 months',
    NOW(),
    INTERVAL '1 hour'
  ) AS timestamp
) dates
CROSS JOIN (
  SELECT pc.id, m.type 
  FROM pin_configs pc
  JOIN modes m ON pc.mode_id = m.id
  LIMIT 10 -- Limit to first 10 pin configs for reasonable data size
) cfg
JOIN modes m ON cfg.type = m.type; 