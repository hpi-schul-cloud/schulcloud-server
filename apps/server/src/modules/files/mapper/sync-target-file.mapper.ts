/* istanbul ignore file */

import { FileRecord } from '@src/modules/files-storage/entity/filerecord.entity';
import { SyncTargetFile } from '../types';

// Temporary functionality for migration to new fileservice
// TODO: Remove when BC-1496 is done!
export class SyncTargetFileMapper {
	static mapToDomain(filerecord: FileRecord): SyncTargetFile {
		const target = new SyncTargetFile({
			id: filerecord._id.toHexString(),
			createdAt: filerecord.createdAt,
			updatedAt: filerecord.updatedAt,
		});

		return target;
	}
}
