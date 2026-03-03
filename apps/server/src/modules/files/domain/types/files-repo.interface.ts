import { EntityId } from '@shared/domain/types';
import { FileEntity } from '../../entity';
import { FileOwnerModel } from './file-owner-model.enum';

export interface FilesRepoInterface {
	findForCleanup(thresholdDate: Date, batchSize: number, offset: number): Promise<FileEntity[]>;

	findByOwnerUserId(ownerUserId: EntityId): Promise<FileEntity[]>;

	findByIdAndOwnerType(ownerId: EntityId, ownerType: FileOwnerModel): Promise<FileEntity[]>;

	findByPermissionRefIdOrCreatorId(userId: EntityId): Promise<FileEntity[]>;
}

export const FILES_REPO = 'FILES_REPO';
