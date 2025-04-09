import { ObjectId } from 'bson';
import { EntityId } from '@shared/domain/types';
import { FileRecord, FileRecordProps, FileRecordSecurityCheck, ParentInfo } from './file-record.do';
import { FileRecordParentType, StorageLocation } from './interface'; // TODO: should be part of the do

export interface StoreLocationMetadata {
	storageLocationId: EntityId;
	storageLocation: StorageLocation;
	parentId: EntityId;
	parentType: FileRecordParentType;
}

export class FileRecordFactory {
	private static build(fileRecordProps: FileRecordProps): FileRecord {
		const fileRecord = new FileRecord(fileRecordProps);

		return fileRecord;
	}

	public static buildFromInput(
		name: string,
		size: number,
		mimeType: string,
		params: StoreLocationMetadata,
		userId: string
	): FileRecord {
		const defaultSecurityCheck = FileRecordSecurityCheck.createWithDefaultProps();

		const props: FileRecordProps = {
			id: new ObjectId().toHexString(),
			size,
			name,
			mimeType,
			parentType: params.parentType,
			parentId: params.parentId,
			creatorId: userId,
			storageLocationId: params.storageLocationId,
			storageLocation: params.storageLocation,
			isUploading: true,
			securityCheck: defaultSecurityCheck,
		};

		const fileRecord = FileRecordFactory.build(props);

		return fileRecord;
	}

	public static buildFromPersistenz(props: FileRecordProps): FileRecord {
		const fileRecord = FileRecordFactory.build(props);

		return fileRecord;
	}

	public static copy(fileRecord: FileRecord, userId: EntityId, targetParentInfo: ParentInfo): FileRecord {
		const { size, name, mimeType, id, securityCheck } = fileRecord.getProps();
		const { parentType, parentId, storageLocation, storageLocationId } = targetParentInfo;
		const copySecurityCheck = fileRecord.isVerified()
			? securityCheck
			: FileRecordSecurityCheck.createWithDefaultProps();

		const props: FileRecordProps = {
			id: new ObjectId().toHexString(),
			size,
			name,
			mimeType,
			parentType,
			parentId,
			creatorId: userId,
			storageLocationId,
			storageLocation,
			// isUploading: true, -> false?
			securityCheck: copySecurityCheck,
			isCopyFrom: id,
		};

		const fileRecordCopy = FileRecordFactory.build(props);

		return fileRecordCopy;
	}
}
