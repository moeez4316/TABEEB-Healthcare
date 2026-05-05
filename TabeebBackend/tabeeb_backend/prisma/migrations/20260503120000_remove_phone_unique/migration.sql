-- Drop unique indexes on phone columns to make phone a non-unique contact field
-- Backup your database before running this migration.

SET FOREIGN_KEY_CHECKS=0;

-- Drop Doctor phone unique index if it exists
DROP INDEX IF EXISTS `Doctor_phone_key` ON `doctor`;

-- Drop Patient phone unique index if it exists
DROP INDEX IF EXISTS `Patient_phone_key` ON `patient`;

SET FOREIGN_KEY_CHECKS=1;

-- Note: Prisma will update its migration history when you run `prisma migrate`.
