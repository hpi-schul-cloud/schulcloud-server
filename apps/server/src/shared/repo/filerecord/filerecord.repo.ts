import { Constructor } from '@mikro-orm/core';
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

	async save(fileRecord: FileRecord): Promise<void> {
		await this.em.persistAndFlush(fileRecord);
	}

	getEntityClass<T extends FileRecord>(targetType: FileRecordTargetType): Constructor<T> | undefined {
		let entityClass: Constructor<T> | undefined;

		const metaData = this.em.getMetadata();
		const rootMeta = metaData.find('FileRecord');
		if (rootMeta) {
			const type = rootMeta.discriminatorMap ? rootMeta.discriminatorMap[targetType] : undefined;
			const meta = type ? metaData.find(type) : rootMeta;
			entityClass = meta?.class;
		}

		return entityClass;
	}
}
