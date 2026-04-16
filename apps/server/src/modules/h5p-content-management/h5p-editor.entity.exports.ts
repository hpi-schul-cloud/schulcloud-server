import { User } from '@modules/user/repo';
import { H5PContent, InstalledLibrary } from './repo';

export const ENTITIES = [H5PContent, InstalledLibrary, User];
export const TEST_ENTITIES = [...ENTITIES];
