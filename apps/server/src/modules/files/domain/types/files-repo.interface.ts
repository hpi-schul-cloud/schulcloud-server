import { EntityId } from '@shared/domain/types';
import { FileDo } from '../do/file';
import { FileAuthContext } from './file-auth-context';
import { FileOwnerModel } from './file-owner-model.enum';

export interface FilesRepoInterface {
	findByIdAndOwnerType(ownerId: EntityId, ownerType: FileOwnerModel, authContext: FileAuthContext): Promise<FileDo[]>;
}

export const FILES_REPO = 'FILES_REPO';
