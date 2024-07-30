import { ObjectId } from '@mikro-orm/mongodb';
import { Factory } from 'fishery';
import { FileRecordRef } from '../domain';

export const fileRecordRefFactory = Factory.define<FileRecordRef>(({ sequence }) => {
	const fileName = `fileName-${sequence}`;
	const fileRecordId = new ObjectId().toHexString();

	return {
		uploadUrl: 'uploadUrl',
		fileName,
		fileRecordId,
		getPreviewUrl(): string {
			return `/api/v3/file/preview/${fileRecordId}/${encodeURIComponent(fileName)}`;
		},
	};
});
