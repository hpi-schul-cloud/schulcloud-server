import { ObjectId } from 'bson';
import { DeepPartial } from 'fishery';
import {
	FileRecord,
	FileRecordParentType,
	FileRecordProps,
	FileRecordSecurityCheck,
	ScanStatus,
	StorageLocation,
} from '../domain';
import { FileRecordFactory } from '../domain/file-record.factory';

export class FileRecordTestFactory {
	private sequence = 0;

	public props: FileRecordProps = {
		id: new ObjectId().toHexString(),
		size: 100,
		name: `file-record-name #${this.sequence}`,
		mimeType: 'application/octet-stream',
		parentType: FileRecordParentType.Course,
		parentId: new ObjectId().toHexString(),
		creatorId: new ObjectId().toHexString(),
		storageLocationId: new ObjectId().toHexString(),
		storageLocation: StorageLocation.SCHOOL,
		deletedSince: undefined,
		createdAt: new Date(Date.now() - 1000),
		updatedAt: new Date(Date.now() - 1000),
	};

	private securityCheck = FileRecordSecurityCheck.createWithDefaultProps();

	public build(params: DeepPartial<FileRecordProps> = {}): FileRecord {
		const props = Object.assign({ ...this.props }, params);
		props.id = params.id ?? new ObjectId().toHexString();

		const fileRecord = FileRecordFactory.buildFromFileRecordProps(props, this.securityCheck);

		this.sequence += 1;

		return fileRecord;
	}

	public buildList(number: number, params: DeepPartial<FileRecordProps> = {}): FileRecord[] {
		const fileRecords: FileRecord[] = [];
		for (let i = 0; i < number; i += 1) {
			const fileRecord = this.build(params);
			fileRecords.push(fileRecord);
		}

		return fileRecords;
	}

	public withDeletedSince(date?: Date): this {
		const dateNow = new Date(Date.now() - 1000);
		this.props.deletedSince = date || dateNow;

		return this;
	}

	public withScanStatus(scanStatus?: ScanStatus): this {
		this.securityCheck = new FileRecordSecurityCheck({
			status: scanStatus ?? ScanStatus.VERIFIED,
			reason: 'scan-reason',
			requestToken: 'scan-request-token',
			updatedAt: new Date(Date.now() - 1000),
		});

		return this;
	}
}

export const fileRecordTestFactory = (): FileRecordTestFactory => new FileRecordTestFactory();
