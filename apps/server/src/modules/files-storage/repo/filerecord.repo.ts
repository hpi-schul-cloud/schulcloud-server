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
		const fileRecord = await this.findOneOrFail(scope);

		return fileRecord;
	}

	public async findOneByIdMarkedForDelete(id: EntityId): Promise<FileRecord> {
		const scope = new FileRecordScope().byFileRecordId(id).byMarkedForDelete(true);
		const fileRecord = await this.findOneOrFail(scope);

		return fileRecord;
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

	public async delete(fileRecords: FileRecord[]): Promise<void> {
		const entities = this.getEntitiesReferenceFromDOs(fileRecords);
		await this.em.removeAndFlush(entities);
	}

	public async update(fileRecords: FileRecord[]): Promise<void> {
		// param = DO
		// map to entity
		// load entities
		// override keys?
		// persistAndFlush
		// return DO ?? -> no
		const entities = this.getEntitiesReferenceFromDOs(fileRecords);

		// TODO implement!

		await Promise.resolve();
	}

	// TODO: move to utils
	private getEntitiesReferenceFromDOs(fileRecords: FileRecord[]): FileRecordEntity[] {
		const entities = fileRecords.map((item) => this.getEntityReferenceFromDO(item));

		return entities;
	}

	private getEntityReferenceFromDO(fileRecord: FileRecord): FileRecordEntity {
		// TODO: check why this method is only in changlog and not documentated, it include also a bug that it is fixed later
		// https://gist.github.com/B4nan/3fb771464e4c4499c26c9f4e684692a4#file-create-reference-ts-L8
		// https://mikro-orm.io/api/core/changelog#563-2022-12-28
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

		const fileRecords = FileRecordDOMapper.entitiesToDOs(fileRecordEntities);

		return [fileRecords, count];
	}

	private async findOneOrFail(scope: FileRecordScope): Promise<FileRecord> {
		const filesRecordEntity = await this.em.findOneOrFail(FileRecordEntity, scope.query);
		const fileRecord = FileRecordDOMapper.entityToDO(filesRecordEntity);

		return fileRecord;
	}
}
