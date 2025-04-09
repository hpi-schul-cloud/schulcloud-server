import { EntityName } from '@mikro-orm/core';
import { IFindOptions } from '@shared/domain/interface';
import { Counted, EntityId } from '@shared/domain/types';
import { FileRecordEntity } from '../../repo'; // TODO: invalid import
import { StorageLocation } from './storage-location.enum';

export interface FileRecordRepo {
	get entityName(): EntityName<FileRecordEntity>;

	findOneById(id: EntityId): Promise<FileRecordEntity>;

	findOneByIdMarkedForDelete(id: EntityId): Promise<FileRecordEntity>;

	findByParentId(parentId: EntityId, options?: IFindOptions<FileRecordEntity>): Promise<Counted<FileRecordEntity[]>>;

	markForDeleteByStorageLocation(storageLocation: StorageLocation, storageLocationId: EntityId): Promise<number>;

	findByStorageLocationIdAndParentId(
		storageLocation: StorageLocation,
		storageLocationId: EntityId,
		parentId: EntityId,
		options?: IFindOptions<FileRecordEntity>
	): Promise<Counted<FileRecordEntity[]>>;

	findByStorageLocationIdAndParentIdAndMarkedForDelete(
		storageLocation: StorageLocation,
		storageLocationId: EntityId,
		parentId: EntityId,
		options?: IFindOptions<FileRecordEntity>
	): Promise<Counted<FileRecordEntity[]>>;

	findBySecurityCheckRequestToken(token: string): Promise<FileRecordEntity>;

	findByCreatorId(creatorId: EntityId): Promise<Counted<FileRecordEntity[]>>;

	save(entities: FileRecordEntity | FileRecordEntity[]): Promise<void>;

	delete(entities: FileRecordEntity | FileRecordEntity[]): Promise<void>;
}

export const FILE_RECORD_REPO = 'FILE_RECORD_REPO';
