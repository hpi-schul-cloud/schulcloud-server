import { AccountEntity } from '@modules/account/repo';
import { SynchronizationEntity } from '@modules/synchronization';
import { User } from '@modules/user/repo';

export const ENTITIES = [SynchronizationEntity, User, AccountEntity];
export const TEST_ENTITIES = [...ENTITIES];
