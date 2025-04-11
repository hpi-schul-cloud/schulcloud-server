import { Embeddable, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';

@Embeddable()
export class FileRecordRefEmbeddable {
	@Property()
	public uploadUrl: string;

	@Property()
	public fileRecord: ObjectId;

	@Property()
	public fileName: string;

	constructor(props: FileRecordRefEmbeddable) {
		this.uploadUrl = props.uploadUrl;
		this.fileRecord = props.fileRecord;
		this.fileName = props.fileName;
	}
}
