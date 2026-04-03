-- Insert the review form configuration
INSERT INTO public.form_configurations (id, form_type, is_active) 
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'review_form', true);

-- Insert rating categories with current hardcoded values
INSERT INTO public.rating_category_configs (category_key, category_label, display_order, is_active) VALUES
('workLifeBalance', 'Work-Life Balance', 1, true),
('compensation', 'Compensation & Benefits', 2, true),
('culture', 'Culture & Values', 3, true),
('management', 'Senior Management', 4, true),
('careerGrowth', 'Career Opportunities', 5, true);

-- Insert form fields configuration
INSERT INTO public.form_fields (form_config_id, field_key, field_label, field_type, display_order, is_required, is_visible, placeholder, options) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'title', 'Review Title', 'text', 1, true, true, 'Give your review a headline', NULL),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'role_title', 'Your Job Title', 'text', 2, false, true, 'e.g. Software Engineer', NULL),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'employment_status', 'Employment Status', 'select', 3, false, true, NULL, '["Current Employee", "Former Employee"]'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'pros', 'Pros', 'textarea', 4, true, true, 'What do you like about working here?', NULL),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'cons', 'Cons', 'textarea', 5, true, true, 'What could be improved?', NULL),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'salary_min', 'Minimum Salary', 'number', 6, false, true, 'Min', NULL),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'salary_max', 'Maximum Salary', 'number', 7, false, true, 'Max', NULL),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'currency', 'Currency', 'select', 8, false, true, NULL, '["USD", "EUR", "GBP", "CAD", "AUD"]'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'recommend_to_friend', 'Would you recommend this company to a friend?', 'checkbox', 9, false, true, NULL, NULL),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ceo_approval', 'Do you approve of the CEO?', 'checkbox', 10, false, true, NULL, NULL);