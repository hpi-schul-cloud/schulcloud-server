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
	// later findOneExpiresByIt

	async save(fileRecord: FileRecord): Promise<void> {
		await this.em.persistAndFlush(fileRecord);
	}

	async multiSave(fileRecords: FileRecord[]): Promise<void> {
		await this.em.persistAndFlush(fileRecords);
	}

	async delete(fileRecord: FileRecord): Promise<void> {
		await this.em.removeAndFlush(fileRecord);
	}

	// todo: filter NOT expires != null
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

	async findBySecurityCheckRequestToken(token: string): Promise<FileRecord> {
		return this.em.findOneOrFail(FileRecord, new FileRecordScope().bySecurityCheckRequestToken(token).query);
	}
}
