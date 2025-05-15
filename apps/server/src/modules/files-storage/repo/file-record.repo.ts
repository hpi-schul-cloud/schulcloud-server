import { EntityName, Utils } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { IFindOptions, SortOrder } from '@shared/domain/interface';
import { Counted, EntityId } from '@shared/domain/types';
import { StorageLocation } from '../domain';
import { FileRecord } from '../domain/file-record.do';
import { FileRecordRepo } from '../domain/interface/file-record.repo.interface';
import { FileRecordEntity } from './file-record.entity';
import { FileRecordEntityMapper } from './mapper';
import { FileRecordScope } from './scope/file-record-scope';

@Injectable()
export class FileRecordMikroOrmRepo implements FileRecordRepo {
	constructor(private readonly em: EntityManager) {}

	get entityName(): EntityName<FileRecordEntity> {
		return FileRecordEntity;
	}

	public async findOneById(id: EntityId): Promise<FileRecord> {
		const scope = new FileRecordScope().byFileRecordId(id).byMarkedForDelete(false);
		const fileRecord = await this.findOneOrFail(scope);

		return fileRecord;
	}

	public async findMultipleById(
		ids: EntityId[],
		options?: IFindOptions<FileRecordEntity>
	): Promise<Counted<FileRecord[]>> {
		const scope = new FileRecordScope().byFileRecordIds(ids).byMarkedForDelete(false);
		const result = await this.findAndCount(scope, options);

		return result;
	}

	public async findOneByIdMarkedForDelete(id: EntityId): Promise<FileRecord> {
		const scope = new FileRecordScope().byFileRecordId(id).byMarkedForDelete(true);
		const fileRecord = await this.findOneOrFail(scope);

		return fileRecord;
	}

	public async findByParentId(
		parentId: EntityId,
		options?: IFindOptions<FileRecordEntity>
	): Promise<Counted<FileRecord[]>> {
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
		const result = await this.em.nativeUpdate(this.entityName, scope.query, { deletedSince: new Date() });

		return result;
	}

	public async findByStorageLocationIdAndParentId(
		storageLocation: StorageLocation,
		storageLocationId: EntityId,
		parentId: EntityId,
		options?: IFindOptions<FileRecordEntity>
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
		options?: IFindOptions<FileRecordEntity>
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

	public async save(fileRecord: FileRecord | FileRecord[]): Promise<void> {
		const fileRecords = Utils.asArray(fileRecord);

		fileRecords.forEach((f) => {
			const entity = FileRecordEntityMapper.mapDoToEntity(this.em, f);
			this.em.persist(entity);
		});

		await this.flush();
	}

	public async delete(fileRecord: FileRecord | FileRecord[]): Promise<void> {
		const fileRecords = Utils.asArray(fileRecord);

		fileRecords.forEach((f) => {
			const entity = FileRecordEntityMapper.mapDoToEntity(this.em, f);
			this.em.remove(entity);
		});

		await this.em.flush();
	}

	private async findAndCount(
		scope: FileRecordScope,
		options?: IFindOptions<FileRecordEntity>
	): Promise<Counted<FileRecord[]>> {
		const { pagination } = options || {};
		const order = { createdAt: SortOrder.desc, id: SortOrder.asc };

		const [entities, count] = await this.em.findAndCount(FileRecordEntity, scope.query, {
			offset: pagination?.skip,
			limit: pagination?.limit,
			orderBy: order,
		});

		const fileRecords = entities.map((entity) => FileRecordEntityMapper.mapEntityToDo(entity));

		return [fileRecords, count];
	}

	private async findOneOrFail(scope: FileRecordScope): Promise<FileRecord> {
		const entity = await this.em.findOneOrFail(FileRecordEntity, scope.query);

		const fileRecord = FileRecordEntityMapper.mapEntityToDo(entity);

		return fileRecord;
	}

	private flush(): Promise<void> {
		return this.em.flush();
	}
}
