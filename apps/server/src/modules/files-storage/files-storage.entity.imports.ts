import { User } from '@modules/user/repo';
import { FileRecord, FileRecordSecurityCheck } from './repo';

export const ENTITIES = [FileRecord, FileRecordSecurityCheck];
export const TEST_ENTITIES = [...ENTITIES, User];
