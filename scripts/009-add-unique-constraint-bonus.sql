-- Add unique constraint to prevent duplicate welcome bonuses
ALTER TABLE transactions 
ADD CONSTRAINT unique_welcome_bonus 
UNIQUE (user_id, reference) 
WHERE type = 'credit' AND description LIKE '%Registration bonus%';

-- Create index for better performance on bonus checks
CREATE INDEX IF NOT EXISTS idx_transactions_bonus_check 
ON transactions (user_id, type, description) 
WHERE type = 'credit' AND (description LIKE '%Registration bonus%' OR description LIKE '%Welcome bonus%');
