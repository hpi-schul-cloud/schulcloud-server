import { EntityName } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { IFindOptions, SortOrder } from '@shared/domain/interface';
import { Counted, EntityId } from '@shared/domain/types';
import { BaseRepo } from '@shared/repo/base.repo';
import { FileRecord } from '../entity';
import { StorageLocation } from '../interface';
import { FileRecordScope } from './filerecord-scope';

@Injectable()
export class FileRecordRepo extends BaseRepo<FileRecord> {
	get entityName(): EntityName<FileRecord> {
		return FileRecord;
	}

	public async findOneById(id: EntityId): Promise<FileRecord> {
		const scope = new FileRecordScope().byFileRecordId(id).byMarkedForDelete(false);
		const fileRecord = await this.findOneOrFail(scope);

		return fileRecord;
	}

	public async findOneByIdMarkedForDelete(id: EntityId): Promise<FileRecord> {
		const scope = new FileRecordScope().byFileRecordId(id).byMarkedForDelete(true);
		const fileRecord = await this.findOneOrFail(scope);

		return fileRecord;
	}

	public async findByParentId(parentId: EntityId, options?: IFindOptions<FileRecord>): Promise<Counted<FileRecord[]>> {
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
		options?: IFindOptions<FileRecord>
	): Promise<Counted<FileRecord[]>> {
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
		options?: IFindOptions<FileRecord>
	): Promise<Counted<FileRecord[]>> {
		const scope = new FileRecordScope()
			.byStorageLocation(storageLocation)
			.byStorageLocationId(storageLocationId)
			.byParentId(parentId)
			.byMarkedForDelete(true);
		const result = await this.findAndCount(scope, options);

		return result;
	}

	public async findBySecurityCheckRequestToken(token: string): Promise<FileRecord> {
		// Must also find expires in future. Please do not add .byExpires().
		const scope = new FileRecordScope().bySecurityCheckRequestToken(token);

		const fileRecord = await this.findOneOrFail(scope);

		return fileRecord;
	}

	public async findByCreatorId(creatorId: EntityId): Promise<Counted<FileRecord[]>> {
		const scope = new FileRecordScope().byCreatorId(creatorId);
		const result = await this.findAndCount(scope);

		return result;
	}

	private async findAndCount(
		scope: FileRecordScope,
		options?: IFindOptions<FileRecord>
	): Promise<Counted<FileRecord[]>> {
		const { pagination } = options || {};
		const order = { createdAt: SortOrder.desc, id: SortOrder.asc };

		const [fileRecords, count] = await this._em.findAndCount(FileRecord, scope.query, {
			offset: pagination?.skip,
			limit: pagination?.limit,
			orderBy: order,
		});

		return [fileRecords, count];
	}

	private async findOneOrFail(scope: FileRecordScope): Promise<FileRecord> {
		const fileRecord = await this._em.findOneOrFail(FileRecord, scope.query);

		return fileRecord;
	}
}
