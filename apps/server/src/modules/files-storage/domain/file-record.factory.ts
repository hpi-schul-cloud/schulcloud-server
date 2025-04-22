import { EntityId } from '@shared/domain/types';
import { ObjectId } from 'bson';
import { FileRecord, FileRecordProps, FileRecordSecurityCheck, ParentInfo } from './file-record.do';

export class FileRecordFactory {
	private static build(fileRecordProps: FileRecordProps, securityCheck: FileRecordSecurityCheck): FileRecord {
		const fileRecord = new FileRecord(fileRecordProps, securityCheck);

		return fileRecord;
	}

	public static buildFromExternalInput(
		name: string,
		size: number,
		mimeType: string,
		params: ParentInfo,
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
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const fileRecord = FileRecordFactory.build(props, defaultSecurityCheck);

		return fileRecord;
	}

	public static buildFromFileRecordProps(props: FileRecordProps, securityCheck: FileRecordSecurityCheck): FileRecord {
		const fileRecord = FileRecordFactory.build(props, securityCheck);

		return fileRecord;
	}

	public static copy(fileRecord: FileRecord, userId: EntityId, targetParentInfo: ParentInfo): FileRecord {
		const { size, name, mimeType, id, createdAt, updatedAt } = fileRecord.getProps();
		const { parentType, parentId, storageLocation, storageLocationId } = targetParentInfo;
		const newSecurityCheck = fileRecord.createSecurityScanBasedOnStatus();

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
			// TODO: sollte hier der Status vom kopierten File übernommen werden? Oder undefined?
			// isUploading: true
			isCopyFrom: id,
			// TODO: hier den Status übernehmen?
			createdAt,
			updatedAt,
		};

		const fileRecordCopy = FileRecordFactory.build(props, newSecurityCheck);

		return fileRecordCopy;
	}
}
