import { ObjectId } from '@mikro-orm/mongodb';
import { Factory } from 'fishery';
// type alias can be possible
// type FileRecord = FileRecordResponse
// https://docs.dbildungscloud.de/display/DBH/Arc+Meeting+2025-03-06
import { FileRecordParentType, FileRecordResponse, FileRecordScanStatus, PreviewStatus } from '../generated';

export const fileRecordResponseFactory = Factory.define<FileRecordResponse>(({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		name: `file-record #${sequence}`,
		parentId: new ObjectId().toHexString(),
		url: 'https://test.com/',
		securityCheckStatus: FileRecordScanStatus.PENDING,
		size: 1000,
		creatorId: new ObjectId().toHexString(),
		mimeType: 'application/octet-stream',
		parentType: FileRecordParentType.COURSES,
		previewStatus: PreviewStatus.PREVIEW_POSSIBLE,
	};
});
