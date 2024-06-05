import { Injectable } from '@nestjs/common';
import { IFindOptions, SortOrder } from '@shared/domain/interface';
import { Counted, EntityId } from '@shared/domain/types';
import { BaseRepo } from '@shared/repo';
import { FileRecord, StorageLocation } from '../entity';
import { FileRecordScope } from './filerecord-scope';

@Injectable()
export class FileRecordRepo extends BaseRepo<FileRecord> {
	get entityName() {
		return FileRecord;
	}

	async findOneById(id: EntityId): Promise<FileRecord> {
		const scope = new FileRecordScope().byFileRecordId(id).byMarkedForDelete(false);
		const fileRecord = await this.findOneOrFail(scope);

		return fileRecord;
	}

	async findOneByIdMarkedForDelete(id: EntityId): Promise<FileRecord> {
		const scope = new FileRecordScope().byFileRecordId(id).byMarkedForDelete(true);
		const fileRecord = await this.findOneOrFail(scope);

		return fileRecord;
	}

	async findByParentId(parentId: EntityId, options?: IFindOptions<FileRecord>): Promise<Counted<FileRecord[]>> {
		const scope = new FileRecordScope().byParentId(parentId).byMarkedForDelete(false);
		const result = await this.findAndCount(scope, options);

		return result;
	}

	async findByStorageLocationIdAndParentId(
		storageLocation: StorageLocation,
		storageLocationId: EntityId,
		parentId: EntityId,
		options?: IFindOptions<FileRecord>
	): Promise<Counted<FileRecord[]>> {
		const scope = new FileRecordScope()
			.byStorageType(storageLocation)
			.byStorageLocationId(storageLocationId)
			.byParentId(parentId)
			.byMarkedForDelete(false);
		const result = await this.findAndCount(scope, options);

		return result;
	}

	async findByStorageLocationIdAndParentIdAndMarkedForDelete(
		storageLocation: StorageLocation,
		storageLocationId: EntityId,
		parentId: EntityId,
		options?: IFindOptions<FileRecord>
	): Promise<Counted<FileRecord[]>> {
		const scope = new FileRecordScope()
			.byStorageType(storageLocation)
			.byStorageLocationId(storageLocationId)
			.byParentId(parentId)
			.byMarkedForDelete(true);
		const result = await this.findAndCount(scope, options);

		return result;
	}

	async findBySecurityCheckRequestToken(token: string): Promise<FileRecord> {
		// Must also find expires in future. Please do not add .byExpires().
		const scope = new FileRecordScope().bySecurityCheckRequestToken(token);

		const fileRecord = await this.findOneOrFail(scope);

		return fileRecord;
	}

	async findByCreatorId(creatorId: EntityId): Promise<Counted<FileRecord[]>> {
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
