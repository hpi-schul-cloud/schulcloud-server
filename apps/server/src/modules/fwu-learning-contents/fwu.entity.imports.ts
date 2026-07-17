import { SystemEntity } from '@modules/system/repo';
import { UserLoginMigrationEntity } from '@modules/user-login-migration/repo';
import { User } from '@modules/user/repo';

export const TEST_ENTITIES = [User, SystemEntity, UserLoginMigrationEntity];
