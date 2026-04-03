ALTER TABLE review_reports 
ADD COLUMN reported_section text DEFAULT 'review';

COMMENT ON COLUMN review_reports.reported_section IS 
  'Indicates which section of the review was reported: review (main content) or interview (interview experience)';