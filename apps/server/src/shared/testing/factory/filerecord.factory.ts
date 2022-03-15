import { FileRecord, FileRecordParentType, FileSecurityCheck, IFileRecordProperties } from '@shared/domain';
import { ObjectId } from 'bson';

import { BaseFactory } from './base.factory';

export const fileRecordFactory = BaseFactory.define<FileRecord, IFileRecordProperties>(FileRecord, ({ sequence }) => {
	return {
		size: Math.round(Math.random() * 100000),
		name: `file-record #${sequence}`,
		mimeType: 'application/octet-stream',
		securityCheck: new FileSecurityCheck({}),
		parentType: FileRecordParentType.Course,
		parentId: new ObjectId(),
		creatorId: new ObjectId(),
		schoolId: new ObjectId(),
	};
});
