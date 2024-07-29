import { EntityId } from '@shared/domain/types';

export interface FileRecordRefProps {
	uploadUrl: string;

	fileName: string;

	fileRecordId: EntityId;
}

export class FileRecordRef implements FileRecordRefProps {
	uploadUrl: string;

	fileName: string;

	fileRecordId: EntityId;

	constructor(props: FileRecordRefProps) {
		this.uploadUrl = props.uploadUrl;
		this.fileName = props.fileName;
		this.fileRecordId = props.fileRecordId;
	}

	getPreviewUrl() {
		return `/api/v3/file/preview/${this.fileRecordId}/${encodeURIComponent(this.fileName)}`;
	}
}
