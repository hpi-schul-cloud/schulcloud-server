import { BaseTestFactory } from '@shared/testing/factory/base-test.factory';
import { ObjectId } from 'bson';
import { FileRecordParentType } from '../interface';
import { FileRecord, FileRecordParams } from './filerecord.do';
import { fileRecordFactory } from './filerecord.factory';

export const fileRecordTestFactory = BaseTestFactory.define<FileRecord, FileRecordParams>(
	FileRecord,
	({ sequence }) => {
		const securityCheck = fileRecordFactory.buildSecurityCheckProperties();
		const defaultProps = {
			id: new ObjectId().toHexString(), // TODO: check on which place the id is generated
			size: 1000,
			name: `file-record name ${sequence}`,
			mimeType: 'application/octet-stream',
			securityCheck,
			parentType: FileRecordParentType.Course,
			parentId: new ObjectId().toHexString(),
			creatorId: new ObjectId().toHexString(),
			schoolId: new ObjectId().toHexString(),
		};

		return defaultProps;
	}
);
