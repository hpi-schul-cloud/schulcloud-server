import { BaseRepo2, Counted, EntityId, IFindOptions, SortOrder } from '@shared/domain';
import { Injectable } from '@nestjs/common';
import { DataBaseManager } from '@shared/infra/database/database-manager';
import { FileRecord } from '../domain';
import type { FilesStorageRepo } from '../service';
import { fileRecordDOMapper } from './filerecord-do.mapper';
import { FileRecordScope } from './filerecord-scope';
import { FileRecordEntity } from './filerecord.entity';

@Injectable()
export class FileRecordRepo extends BaseRepo2<FileRecord> implements FilesStorageRepo {
	constructor(private readonly dbm: DataBaseManager<FileRecordEntity>) {
		super();
	}

	public async findOneById(id: EntityId): Promise<FileRecord> {
		const scope = new FileRecordScope().byFileRecordId(id).byMarkedForDelete(false);
		const fileRecord = await this.findOne(scope);

		return fileRecord;
	}

	public async findOneByIdMarkedForDelete(id: EntityId): Promise<FileRecord> {
		const scope = new FileRecordScope().byFileRecordId(id).byMarkedForDelete(true);
		const fileRecord = await this.findOne(scope);

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
		const fileRecord = await this.findOne(scope);

		return fileRecord;
	}

	public async delete(fileRecords: FileRecord[]): Promise<void> {
		const entities = await this.find(fileRecords);
		await this.dbm.remove(entities);
	}

	// required that the entity must be loaded before...if not it is override
	/*
	private async persist2(fileRecords: FileRecord[]): Promise<void> {
		fileRecords.forEach((domainObject) => {
			const existing = this.dbm.em.getUnitOfWork().getById<FileRecordEntity>(FileRecordEntity.name, domainObject.id);
			if (existing) {
				this.dbm.em.assign(existing, domainObject);
			} else {
				const entity = fileRecordDOMapper.createEntity(domainObject);
				this.dbm.em.persist(entity);
			}
		});

		await this.dbm.em.flush();
	}
	*/

	public async persist(fileRecords: FileRecord[]): Promise<void> {
		const foundEntities = await this.find(fileRecords);
		const entities = fileRecordDOMapper.createOrMergeintoEntities(fileRecords, foundEntities);
		await this.dbm.persist(entities);
	}

	// ---------------------------------------------------------------
	// findById and findByIds | findByDomainObject | findByDomainObjects can be possible to move to DataBaseManager
	// delete can also be moved, also this do not need the mapper
	// it is possible to add mapper to over params
	private async find(fileRecords: FileRecord[]): Promise<FileRecordEntity[]> {
		const scope = new FileRecordScope().byIds(fileRecords);
		const fileRecordEntities = await this.dbm.find(FileRecordEntity, scope.query);

		return fileRecordEntities;
	}

	private async findOne(scope: FileRecordScope): Promise<FileRecord> {
		const filesRecordEntity = await this.dbm.findOne(FileRecordEntity, scope.query);
		const fileRecord = fileRecordDOMapper.entityToDO(filesRecordEntity);

		return fileRecord;
	}

	private async findAndCount(
		scope: FileRecordScope,
		options?: IFindOptions<FileRecord>
	): Promise<Counted<FileRecord[]>> {
		const { pagination } = options || {};
		const order = { createdAt: SortOrder.desc, id: SortOrder.asc };

		const [fileRecordEntities, count] = await this.dbm.findAndCount(FileRecordEntity, scope.query, {
			offset: pagination?.skip,
			limit: pagination?.limit,
			orderBy: order,
		});

		const fileRecords = fileRecordDOMapper.entitiesToDOs(fileRecordEntities);

		return [fileRecords, count];
	}

	/* solution for delete over PK
	public async delete(fileRecords: FileRecord[]): Promise<void> {
		const entities = this.getEntitiesReferenceFromDOs(fileRecords);
		await this.em.removeAndFlush(entities);
	}

	// TODO: move to utils make private
	private getEntitiesReferenceFromDOs(fileRecords: FileRecord[]): FileRecordEntity[] {
		const entities = fileRecords.map((item) => this.getEntityReferenceFromDO(item));

		return entities;
	}

	// TODO private
	public getEntityReferenceFromDO(fileRecord: FileRecord): FileRecordEntity {
		// TODO: check why this method is only in changlog and not documentated, it include also a bug that it is fixed later
		// https://gist.github.com/B4nan/3fb771464e4c4499c26c9f4e684692a4#file-create-reference-ts-L8
		// https://mikro-orm.io/api/core/changelog#563-2022-12-28
		const fileRecordEntity = Reference.createFromPK(FileRecordEntity, fileRecord.id);

		return fileRecordEntity;
	}
*/
}
