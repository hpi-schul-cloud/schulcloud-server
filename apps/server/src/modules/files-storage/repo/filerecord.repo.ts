import { Reference } from '@mikro-orm/core';
import { BaseRepo2, Counted, EntityId, IFindOptions, SortOrder } from '@shared/domain';
import { MongoEntityManager } from '@mikro-orm/mongodb';
import { FileRecord, IFileRecordParams } from '../domain';
import type { IFilesStorageRepo } from '../service';
import { FileRecordDOMapper } from './fileRecordDO.mapper';
import { FileRecordScope } from './filerecord-scope';
import { FileRecordEntity } from './filerecord.entity';

function getArray<T>(input: T | T[]): T[] {
	const result = Array.isArray(input) ? input : [input];

	return result;
}

export class FileRecordRepo extends BaseRepo2<FileRecord> implements IFilesStorageRepo {
	constructor(private readonly em: MongoEntityManager) {
		super();
	}

	public async findOneById(id: EntityId): Promise<FileRecord> {
		const scope = new FileRecordScope().byFileRecordId(id).byMarkedForDelete(false);
		const fileRecordDO = await this.findOneOrFail(scope);

		return fileRecordDO;
	}

	public async findOneByIdMarkedForDelete(id: EntityId): Promise<FileRecord> {
		const scope = new FileRecordScope().byFileRecordId(id).byMarkedForDelete(true);
		const fileRecordDO = await this.findOneOrFail(scope);

		return fileRecordDO;
	}

	public async findBySchoolIdAndParentId(
		schoolId: EntityId,
		parentId: EntityId,
		options?: IFindOptions<FileRecord>
	): Promise<Counted<FileRecord[]>> {
		const scope = new FileRecordScope().bySchoolId(schoolId).byParentId(parentId).byMarkedForDelete(false);
		const result = await this.findAndCount(scope, options);

		return result;
	}

	public async findBySchoolIdAndParentIdAndMarkedForDelete(
		schoolId: EntityId,
		parentId: EntityId,
		options?: IFindOptions<FileRecord>
	): Promise<Counted<FileRecord[]>> {
		const scope = new FileRecordScope().bySchoolId(schoolId).byParentId(parentId).byMarkedForDelete(true);
		const result = await this.findAndCount(scope, options);

		return result;
	}

	public async findBySecurityCheckRequestToken(token: string): Promise<FileRecord> {
		// Must also find expires in future. Please do not add .byExpires().
		const scope = new FileRecordScope().bySecurityCheckRequestToken(token);

		const fileRecord = await this.findOneOrFail(scope);

		return fileRecord;
	}

	public async delete(fileRecordDOs: FileRecord[]): Promise<void> {
		const entities = this.getEntitiesReferenceFromDOs(fileRecordDOs);
		await this.em.removeAndFlush(entities);
	}

	public async update(fileRecordDOs: FileRecord[]): Promise<void> {
		// param = DO
		// map to entity
		// load entities
		// override keys?
		// persistAndFlush
		// return DO ?? -> no
		const entities = this.getEntitiesReferenceFromDOs(fileRecordDOs);

		// TODO implement!

		await Promise.resolve();
	}

	private getEntitiesReferenceFromDOs(fileRecords: FileRecord[]): FileRecordEntity[] {
		const entities = fileRecords.map((item) => this.getEntityReferenceFromDO(item));

		return entities;
	}

	// TODO: check type error
	private getEntityReferenceFromDO(fileRecord: FileRecord): FileRecordEntity {
		const fileRecordEntity = Reference.createFromPK(FileRecordEntity, fileRecord.id);

		return fileRecordEntity;
	}

	public async save(fileRecordParams: IFileRecordParams[]): Promise<FileRecord[]> {
		const params = getArray(fileRecordParams);
		const entities = params.map((param) => this.entityFactory(param));

		await this.em.persistAndFlush(entities);

		const fileRecords = FileRecordDOMapper.entitiesToDOs(entities);

		return fileRecords;
	}

	private entityFactory(props: IFileRecordParams): FileRecordEntity {
		return new FileRecordEntity(props);
	}

	private async findAndCount(
		scope: FileRecordScope,
		options?: IFindOptions<FileRecord>
	): Promise<Counted<FileRecord[]>> {
		const { pagination } = options || {};
		const order = { createdAt: SortOrder.desc, id: SortOrder.asc };

		const [fileRecordEntities, count] = await this.em.findAndCount(FileRecordEntity, scope.query, {
			offset: pagination?.skip,
			limit: pagination?.limit,
			orderBy: order,
		});

		const fileRecordDOs = FileRecordDOMapper.entitiesToDOs(fileRecordEntities);

		return [fileRecordDOs, count];
	}

	private async findOneOrFail(scope: FileRecordScope): Promise<FileRecord> {
		const filesRecordEntity = await this.em.findOneOrFail(FileRecordEntity, scope.query);
		const fileRecordDO = FileRecordDOMapper.entityToDO(filesRecordEntity);

		return fileRecordDO;
	}
}
