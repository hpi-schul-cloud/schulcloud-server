import { User } from '@shared/domain/entity';
import { H5PContent, InstalledLibrary } from './entity';

export const ENTITIES = [H5PContent, InstalledLibrary];
export const TEST_ENTITIES = [...ENTITIES, User];
