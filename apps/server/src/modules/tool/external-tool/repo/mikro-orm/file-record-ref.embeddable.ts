import { Embeddable, ManyToOne, Property } from '@mikro-orm/core';
import { FileRecord } from '@modules/files-storage/entity';

@Embeddable()
export class FileRecordRefEmbeddable {
	@Property()
	uploadUrl: string;

	@ManyToOne(() => FileRecord)
	fileRecord: FileRecord;

	constructor(props: FileRecordRefEmbeddable) {
		this.uploadUrl = props.uploadUrl;
		this.fileRecord = props.fileRecord;
	}
}
