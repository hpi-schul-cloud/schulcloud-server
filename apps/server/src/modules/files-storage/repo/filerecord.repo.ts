import { EntityName } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { IFindOptions, SortOrder } from '@shared/domain/interface';
import { Counted, EntityId } from '@shared/domain/types';
import { BaseRepo } from '@shared/repo/base.repo';
import { StorageLocation } from '../domain';
import { FileRecordRepo } from '../domain/interface/file-record.repo.interface';
import { FileRecordEntity } from './filerecord.entity';
import { FileRecordScope } from './scope/filerecord-scope';

@Injectable()
export class FileRecordMikroOrmRepo extends BaseRepo<FileRecordEntity> implements FileRecordRepo {
	get entityName(): EntityName<FileRecordEntity> {
		return FileRecordEntity;
	}

	public async findOneById(id: EntityId): Promise<FileRecordEntity> {
		const scope = new FileRecordScope().byFileRecordId(id).byMarkedForDelete(false);
		const fileRecord = await this.findOneOrFail(scope);

		return fileRecord;
	}

	public async findOneByIdMarkedForDelete(id: EntityId): Promise<FileRecordEntity> {
		const scope = new FileRecordScope().byFileRecordId(id).byMarkedForDelete(true);
		const fileRecord = await this.findOneOrFail(scope);

		return fileRecord;
	}

	public async findByParentId(
		parentId: EntityId,
		options?: IFindOptions<FileRecordEntity>
	): Promise<Counted<FileRecordEntity[]>> {
		const scope = new FileRecordScope().byParentId(parentId).byMarkedForDelete(false);
		const result = await this.findAndCount(scope, options);

		return result;
	}

	public async markForDeleteByStorageLocation(
		storageLocation: StorageLocation,
		storageLocationId: EntityId
	): Promise<number> {
		const scope = new FileRecordScope()
			.byStorageLocation(storageLocation)
			.byStorageLocationId(storageLocationId)
			.byMarkedForDelete(false);
		const result = await this._em.nativeUpdate(this.entityName, scope.query, { deletedSince: new Date() });

		return result;
	}

	public async findByStorageLocationIdAndParentId(
		storageLocation: StorageLocation,
		storageLocationId: EntityId,
		parentId: EntityId,
		options?: IFindOptions<FileRecordEntity>
	): Promise<Counted<FileRecordEntity[]>> {
		const scope = new FileRecordScope()
			.byStorageLocation(storageLocation)
			.byStorageLocationId(storageLocationId)
			.byParentId(parentId)
			.byMarkedForDelete(false);
		const result = await this.findAndCount(scope, options);

		return result;
	}

	public async findByStorageLocationIdAndParentIdAndMarkedForDelete(
		storageLocation: StorageLocation,
		storageLocationId: EntityId,
		parentId: EntityId,
		options?: IFindOptions<FileRecordEntity>
	): Promise<Counted<FileRecordEntity[]>> {
		const scope = new FileRecordScope()
			.byStorageLocation(storageLocation)
			.byStorageLocationId(storageLocationId)
			.byParentId(parentId)
			.byMarkedForDelete(true);
		const result = await this.findAndCount(scope, options);

		return result;
	}

	public async findBySecurityCheckRequestToken(token: string): Promise<FileRecordEntity> {
		// Must also find expires in future. Please do not add .byExpires().
		const scope = new FileRecordScope().bySecurityCheckRequestToken(token);

		const fileRecord = await this.findOneOrFail(scope);

		return fileRecord;
	}

	public async findByCreatorId(creatorId: EntityId): Promise<Counted<FileRecordEntity[]>> {
		const scope = new FileRecordScope().byCreatorId(creatorId);
		const result = await this.findAndCount(scope);

		return result;
	}

	private async findAndCount(
		scope: FileRecordScope,
		options?: IFindOptions<FileRecordEntity>
	): Promise<Counted<FileRecordEntity[]>> {
		const { pagination } = options || {};
		const order = { createdAt: SortOrder.desc, id: SortOrder.asc };

		const [fileRecords, count] = await this._em.findAndCount(FileRecordEntity, scope.query, {
			offset: pagination?.skip,
			limit: pagination?.limit,
			orderBy: order,
		});

		return [fileRecords, count];
	}

	private async findOneOrFail(scope: FileRecordScope): Promise<FileRecordEntity> {
		const fileRecord = await this._em.findOneOrFail(FileRecordEntity, scope.query);

		return fileRecord;
	}
}
