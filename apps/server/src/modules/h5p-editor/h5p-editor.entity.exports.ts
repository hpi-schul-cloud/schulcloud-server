import { User } from '@modules/user/repo';
import { H5PContent, InstalledLibrary } from './entity';

export const ENTITIES = [H5PContent, InstalledLibrary];
export const TEST_ENTITIES = [...ENTITIES, User];
