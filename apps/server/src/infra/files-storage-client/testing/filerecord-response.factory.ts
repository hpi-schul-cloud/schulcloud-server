import { ObjectId } from '@mikro-orm/mongodb';
import { Factory } from 'fishery';
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
		isUploading: false,
		isCollaboraEditable: false,
		exceedsCollaboraEditableFileSize: false,
	};
});
