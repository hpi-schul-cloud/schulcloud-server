import { FileRecord, FileRecordTargetType, FileSecurityCheck, IFileRecordProperties } from '@shared/domain';
import { ObjectId } from 'bson';

import { BaseFactory } from './base.factory';

export const fileRecordFactory = BaseFactory.define<FileRecord, IFileRecordProperties>(FileRecord, ({ sequence }) => {
	return {
		size: Math.round(Math.random() * 100000),
		name: `file-record #${sequence}`,
		type: 'application/octet-stream',
		securityCheck: new FileSecurityCheck({}),
		targetType: FileRecordTargetType.Course,
		targetId: new ObjectId(),
		creatorId: new ObjectId(),
		schoolId: new ObjectId(),
	};
});
