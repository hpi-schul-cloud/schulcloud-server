import { AccountEntity } from '@modules/account/repo';
import { Role } from '@modules/role/repo';
import { User } from '@modules/user/repo';
import { ENTITIES } from './board-import.entity.imports';

export const WORKER_ENTITIES = [...ENTITIES, User, Role, AccountEntity];
