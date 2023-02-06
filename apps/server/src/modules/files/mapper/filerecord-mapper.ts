/* istanbul ignore file */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { ObjectId } from '@mikro-orm/mongodb';
import { FileRecordEntity } from '@src/modules/files-storage/repo/filerecord.entity';

export class FileRecordMapper {
	static mapToFileRecord(aggregationResult: Record<string, never>): FileRecordEntity {
		const parentId = new ObjectId(aggregationResult.parent);
		const creatorId = new ObjectId(aggregationResult.creator);
		const schoolId = new ObjectId(aggregationResult.school);

		const fileRecord = new FileRecordEntity({
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
