import { ObjectId } from '@mikro-orm/mongodb';
import { SyncTargetFile, SyncTargetFileData } from '../types';

export class SyncTargetFileMapper {
	static mapToDomain(filerecord: SyncTargetFileData): SyncTargetFile {
		const target = new SyncTargetFile({
			id: (filerecord._id as ObjectId).toHexString(),
			createdAt: filerecord.createdAt as Date,
			updatedAt: filerecord.updatedAt as Date,
		});

		return target;
	}
}
