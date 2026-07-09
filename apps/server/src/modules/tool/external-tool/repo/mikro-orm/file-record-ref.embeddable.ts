import { Embeddable, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';

@Embeddable()
export class FileRecordRefEmbeddable {
	@Property()
	uploadUrl: string;

	@Property()
	fileRecord: ObjectId;

	@Property()
	fileName: string;

	constructor(props: FileRecordRefEmbeddable) {
		this.uploadUrl = props.uploadUrl;
		this.fileRecord = props.fileRecord;
		this.fileName = props.fileName;
	}
}
