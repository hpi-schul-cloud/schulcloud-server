import { ObjectId } from '@mikro-orm/mongodb';
import { Factory } from 'fishery';
import { FileRecordRef } from '../domain';

export const fileRecordRefFactory = Factory.define<FileRecordRef>(
	({ sequence }) =>
		new FileRecordRef({
			uploadUrl: 'uploadUrl',
			fileName: `fileName-${sequence}`,
			fileRecordId: new ObjectId().toHexString(),
		})
);
