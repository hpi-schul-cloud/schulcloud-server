import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';

import { Counted, EntityId, FileRecord, FileRecordTargetType, IFindOptions, SortOrder } from '@shared/domain';
import { FileRecordScope } from './filerecord-scope';

@Injectable()
export class FileRecordRepo {
	constructor(private readonly em: EntityManager) {}

	async findOneById(id: EntityId): Promise<FileRecord> {
		const fileRecord = await this.em.findOneOrFail(FileRecord, id);
		return fileRecord;
	}

	async findByTargetId(targetId: EntityId, options?: IFindOptions<FileRecord>): Promise<Counted<FileRecord[]>> {
		const { pagination } = options || {};

		const scope = new FileRecordScope().byTargetId(targetId);
		const order = { createdAt: SortOrder.desc, id: SortOrder.asc };

		const [fileRecords, count] = await this.em.findAndCount(FileRecord, scope.query, {
			offset: pagination?.skip,
			limit: pagination?.limit,
			orderBy: order,
		});

		return [fileRecords, count];
	}

	async findByTargetType(
		targetType: FileRecordTargetType,
		options?: IFindOptions<FileRecord>
	): Promise<Counted<FileRecord[]>> {
		const { pagination } = options || {};

		const scope = new FileRecordScope().byTargetType(targetType);
		const order = { createdAt: SortOrder.desc, id: SortOrder.asc };

		const [fileRecords, count] = await this.em.findAndCount(FileRecord, scope.query, {
			offset: pagination?.skip,
			limit: pagination?.limit,
			orderBy: order,
		});

		return [fileRecords, count];
	}

	async findBySchoolIdAndTargetId(
		schoolId: EntityId,
		targetId: EntityId,
		options?: IFindOptions<FileRecord>
	): Promise<Counted<FileRecord[]>> {
		const { pagination } = options || {};

		const scope = new FileRecordScope().bySchoolId(schoolId).byTargetId(targetId);
		const order = { createdAt: SortOrder.desc, id: SortOrder.asc };

		const [fileRecords, count] = await this.em.findAndCount(FileRecord, scope.query, {
			offset: pagination?.skip,
			limit: pagination?.limit,
			orderBy: order,
		});

		return [fileRecords, count];
	}

	async findBySchoolIdAndTargetType(
		schoolId: EntityId,
		targetType: FileRecordTargetType,
		options?: IFindOptions<FileRecord>
	): Promise<Counted<FileRecord[]>> {
		const { pagination } = options || {};

		const scope = new FileRecordScope().bySchoolId(schoolId).byTargetType(targetType);
		const order = { createdAt: SortOrder.desc, id: SortOrder.asc };

		const [fileRecords, count] = await this.em.findAndCount(FileRecord, scope.query, {
			offset: pagination?.skip,
			limit: pagination?.limit,
			orderBy: order,
		});

		return [fileRecords, count];
	}

	async save(fileRecord: FileRecord): Promise<void> {
		await this.em.persistAndFlush(fileRecord);
	}
}
