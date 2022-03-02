import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mongodb';

import { Counted, EntityId, FileRecord, IFindOptions, SortOrder } from '@shared/domain';

import { FileRecordScope } from './filerecord-scope';

@Injectable()
export class FileRecordRepo {
	constructor(private readonly em: EntityManager) {}

	async findOneById(id: EntityId): Promise<FileRecord> {
		const fileRecord = await this.em.findOneOrFail(FileRecord, id);
		return fileRecord;
	}

	async save(fileRecord: FileRecord): Promise<void> {
		await this.em.persistAndFlush(fileRecord);
	}

	async delete(fileRecord: FileRecord): Promise<void> {
		await this.em.removeAndFlush(fileRecord);
	}

	async findBySchoolIdAndParentId(
		schoolId: EntityId,
		parentId: EntityId,
		options?: IFindOptions<FileRecord>
	): Promise<Counted<FileRecord[]>> {
		const { pagination } = options || {};

		const scope = new FileRecordScope().bySchoolId(schoolId).byParentId(parentId);
		const order = { createdAt: SortOrder.desc, id: SortOrder.asc };

		const [fileRecords, count] = await this.em.findAndCount(FileRecord, scope.query, {
			offset: pagination?.skip,
			limit: pagination?.limit,
			orderBy: order,
		});

		return [fileRecords, count];
	}
}
