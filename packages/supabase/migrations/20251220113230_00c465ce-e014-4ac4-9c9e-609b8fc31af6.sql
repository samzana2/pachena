-- Add claim_form configuration
INSERT INTO form_configurations (id, form_type, is_active)
VALUES ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'claim_form', true);

-- Add claim form fields
INSERT INTO form_fields (form_config_id, field_key, field_label, field_type, display_order, is_required, is_visible, placeholder)
VALUES
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'fullName', 'Full Name', 'text', 1, true, true, 'John Smith'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'jobTitle', 'Job Title or Role', 'text', 2, true, true, 'HR Director, CEO, etc.'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'workEmail', 'Work Email', 'email', 3, true, true, 'john@company.co.zw'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'companyName', 'Company Name', 'text', 4, true, true, 'Econet Wireless'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'companyWebsite', 'Company Website', 'url', 5, false, true, 'https://www.company.co.zw'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'phoneNumber', 'Phone Number', 'text', 6, false, true, '+263 77 123 4567'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'message', 'Why are you claiming this company?', 'textarea', 7, false, true, 'Tell us about your role and why you should have access...'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'supervisorName', 'Supervisor/CEO Name', 'text', 8, false, true, 'Jane Doe'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'supervisorEmail', 'Supervisor/CEO Email', 'email', 9, false, true, 'ceo@company.co.zw'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'authorizationConfirmed', 'Authorization Confirmation', 'checkbox', 10, true, true, NULL);