import { ObjectId } from 'bson';
import { fileRecordTestFactory } from './file-record.test.factory';
import { FileRecordParentType, StorageLocation, type FileRecord, type ParentInfo } from '../domain';
import { EntityId } from '@shared/domain/types';

export class FileRecordParamsTestFactory {
	public static build(): {
		parentInfo: ParentInfo;
		fileRecords: FileRecord[];
		storageLocationId: EntityId;
		parentId: EntityId;
	} {
		const parentId = new ObjectId().toHexString();
		const storageLocationId = new ObjectId().toHexString();

		const fileRecords = fileRecordTestFactory().buildList(3, { parentId, storageLocationId });

		const parentInfo = FileRecordParamsTestFactory.buildFromInput({
			storageLocationId,
			parentId,
		});

		return { parentInfo, fileRecords, storageLocationId, parentId };
	}

	public static buildFromInput(params: Partial<ParentInfo>): ParentInfo {
		const defaultParamsInfo = {
			storageLocation: StorageLocation.SCHOOL,
			storageLocationId: new ObjectId().toHexString(),
			parentId: new ObjectId().toHexString(),
			parentType: FileRecordParentType.User,
		};

		const parentInfo = Object.assign({}, defaultParamsInfo, params);

		return parentInfo;
	}
}
