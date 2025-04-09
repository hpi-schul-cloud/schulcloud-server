import { User } from '@modules/user/repo';
import { FileRecordEntity, FileRecordSecurityCheck } from './repo';

export const ENTITIES = [FileRecordEntity, FileRecordSecurityCheck];
export const TEST_ENTITIES = [...ENTITIES, User];
