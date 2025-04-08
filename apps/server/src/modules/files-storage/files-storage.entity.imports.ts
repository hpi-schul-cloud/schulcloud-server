import { User } from '@modules/user/repo';
import { FileRecord, FileRecordSecurityCheck } from './repo/entity';

export const ENTITIES = [FileRecord, FileRecordSecurityCheck];
export const TEST_ENTITIES = [...ENTITIES, User];
