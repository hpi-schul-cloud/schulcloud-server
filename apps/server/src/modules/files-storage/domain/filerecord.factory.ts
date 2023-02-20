import { ObjectId } from 'bson';
import { v4 as uuid } from 'uuid';
import {
	FileRecord,
	IFileRecordParams,
	FileRecordParentType,
	IFileSecurityCheckParams,
	ScanStatus,
} from './filerecord.do';
// TODO: check bson vs uuid

// TODO: rename file to ...TestFactory
// TODO: check factory package, or add BaseTestFactory or Interface.
// TODO: chain like .XXX().YYY().build() is needed
export class FileRecordTestFactory {
	public static buildSecurityCheckProps(
		partialProps: Partial<IFileSecurityCheckParams> = {}
	): IFileSecurityCheckParams {
		const defaultProps: IFileSecurityCheckParams = {
			status: ScanStatus.PENDING,
			reason: 'not yet scanned',
			requestToken: uuid(),
			updatedAt: new Date(),
		};

		const props = Object.assign(defaultProps, partialProps);

		return props;
	}

	public static build(partialProps: Partial<IFileRecordParams> = {}): FileRecord {
		const securityCheck = FileRecordTestFactory.buildSecurityCheckProps();
		const defaultProps = {
			id: new ObjectId().toHexString(),
			size: 1000,
			name: 'file-record name',
			mimeType: 'application/octet-stream',
			securityCheck,
			parentType: FileRecordParentType.Course,
			parentId: new ObjectId().toHexString(),
			creatorId: new ObjectId().toHexString(),
			schoolId: new ObjectId().toHexString(),
		};

		const props = Object.assign(defaultProps, partialProps);
		const fileRecord = new FileRecord(props);

		return fileRecord;
	}

	public static buildList(number = 1, partialProps: Partial<IFileRecordParams> = {}): FileRecord[] {
		// TODO: check if Array(number).map work like expected
		const fileRecords = Array(number).map(() => FileRecordTestFactory.build(partialProps));

		return fileRecords;
	}
}
