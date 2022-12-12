/* istanbul ignore file */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { ObjectId } from '@mikro-orm/mongodb';
import { FileRecord } from '@src/modules/files-storage/entity/filerecord.entity';

export class FileRecordMapper {
	static mapToFileRecord(aggregationResult: Record<string, never>): FileRecord {
		const parentId = new ObjectId(aggregationResult.parent);
		const creatorId = new ObjectId(aggregationResult.creator);
		const schoolId = new ObjectId(aggregationResult.school);

		const fileRecord = new FileRecord({
			size: aggregationResult.size,
			name: aggregationResult.name,
			mimeType: aggregationResult.mimeType,
			parentType: aggregationResult.parentType,
			parentId,
			creatorId,
			schoolId,
			deletedSince: aggregationResult.deletedSince,
		});

		fileRecord._id = aggregationResult._id;

		return fileRecord;
	}
}
