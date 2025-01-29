import { AccountEntity } from '@modules/account/domain/entity/account.entity';
import { SystemEntity } from '@modules/system/entity/system.entity';
import { Role, SchoolEntity, SchoolYearEntity, User } from '@shared/domain/entity';

export const ENTITIES = [User, AccountEntity, Role, SchoolEntity, SystemEntity, SchoolYearEntity];
