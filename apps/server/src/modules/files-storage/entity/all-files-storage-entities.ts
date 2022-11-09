import { ALL_ENTITIES } from '@shared/domain';
import { FileRecord, FileSecurityCheck } from './filerecord.entity';

export const ALL_FILES_STORAGE_ENTITIES = [...ALL_ENTITIES, FileRecord, FileSecurityCheck];
