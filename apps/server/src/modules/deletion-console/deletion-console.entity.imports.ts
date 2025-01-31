import { AccountEntity } from '@modules/account/domain/entity/account.entity';
import { User } from '@shared/domain/entity';
import { Role } from '@shared/domain/entity/role.entity';
import { FileEntity } from '../files/entity';

export const ENTITIES = [Role, FileEntity, User, AccountEntity];
export const TEST_ENTITIES = [...ENTITIES];
