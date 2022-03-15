import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mongodb';

import { Counted, EntityId, FileRecord, IFindOptions, SortOrder } from '@shared/domain';

import { FileRecordScope } from './filerecord-scope';

@Injectable()
export class FileRecordRepo {
	constructor(private readonly em: EntityManager) {}

	async findOneById(id: EntityId): Promise<FileRecord> {
		const scope = new FileRecordScope().byFileRecordId(id).byExpires(false);
		const fileRecord = await this.em.findOneOrFail(FileRecord, scope.query);

		return fileRecord;
	}

	async save(fileRecords: FileRecord | FileRecord[]): Promise<void> {
		await this.em.persistAndFlush(fileRecords);
	}

	async delete(fileRecords: FileRecord | FileRecord[]): Promise<void> {
		await this.em.removeAndFlush(fileRecords);
	}

	async findBySchoolIdAndParentId(
		schoolId: EntityId,
		parentId: EntityId,
		options?: IFindOptions<FileRecord>
	): Promise<Counted<FileRecord[]>> {
		const { pagination } = options || {};

		const scope = new FileRecordScope().bySchoolId(schoolId).byParentId(parentId).byExpires(false);
		const order = { createdAt: SortOrder.desc, id: SortOrder.asc };

		const [fileRecords, count] = await this.em.findAndCount(FileRecord, scope.query, {
			offset: pagination?.skip,
			limit: pagination?.limit,
			orderBy: order,
		});

		return [fileRecords, count];
	}

	async findBySecurityCheckRequestToken(token: string): Promise<FileRecord> {
		// Must also find expires in future. Please do not add .byExpires().
		const scope = new FileRecordScope().bySecurityCheckRequestToken(token);

		const fileRecord = await this.em.findOneOrFail(FileRecord, scope.query);

		return fileRecord;
	}
}
