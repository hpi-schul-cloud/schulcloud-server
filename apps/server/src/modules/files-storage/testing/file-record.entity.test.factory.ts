import { ObjectId } from 'bson';
import { DeepPartial } from 'fishery';
import { FileRecordParentType, FileRecordProps, FileRecordSecurityCheck, ScanStatus, StorageLocation } from '../domain';
import { FileRecordEntity } from '../repo';
import { fileRecordEntityFactory } from './file-record.entity.factory';

export class FileRecordEntityTestFactory {
	private sequence = 0;

	public props: FileRecordProps = {
		id: new ObjectId().toHexString(),
		size: 100,
		name: `file-record-name #${this.sequence}`,
		mimeType: 'application/octet-stream',
		securityCheck: FileRecordSecurityCheck.createWithDefaultProps(),
		parentType: FileRecordParentType.Course,
		parentId: new ObjectId().toHexString(),
		creatorId: new ObjectId().toHexString(),
		storageLocationId: new ObjectId().toHexString(),
		storageLocation: StorageLocation.SCHOOL,
		createdAt: new Date(),
		updatedAt: new Date(),
		deletedSince: undefined,
	};

	public build(params: DeepPartial<FileRecordProps> = {}): FileRecordEntity {
		this.props.id = new ObjectId().toHexString();
		this.props = Object.assign(this.props, params);

		const fileRecord = fileRecordEntityFactory.build(this.props);

		this.sequence += 1;

		return fileRecord;
	}

	public buildList(number: number, params: DeepPartial<FileRecordProps> = {}): FileRecordEntity[] {
		const fileRecords: FileRecordEntity[] = [];
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
		this.props.securityCheck.status = scanStatus ?? ScanStatus.VERIFIED;

		return this;
	}
}

export const fileRecordEntityTestFactory = (): FileRecordEntityTestFactory => new FileRecordEntityTestFactory();
