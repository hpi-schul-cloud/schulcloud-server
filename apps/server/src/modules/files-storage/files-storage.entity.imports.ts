import { User } from '@modules/user/repo';
import { FileRecordEntity, FileRecordSecurityCheckEmbeddable } from './repo/filerecord.entity';

export const ENTITIES = [FileRecordEntity, FileRecordSecurityCheckEmbeddable];
export const TEST_ENTITIES = [...ENTITIES, User];
