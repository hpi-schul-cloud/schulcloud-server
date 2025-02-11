import { AccountEntity } from '@modules/account/domain/entity/account.entity';
import { SynchronizationEntity } from '@modules/synchronization';
import { User } from '@shared/domain/entity';

export const ENTITIES = [SynchronizationEntity, User, AccountEntity];
export const TEST_ENTITIES = [...ENTITIES];
