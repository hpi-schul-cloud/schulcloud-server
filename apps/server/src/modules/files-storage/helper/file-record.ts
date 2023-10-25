import { FileRecordParams } from '../controller/dto';
import { FileRecord } from '../entity';
import { PreviewOutputMimeTypes } from '../interface';

export function markForDelete(fileRecords: FileRecord[]): FileRecord[] {
	const markedFileRecords = fileRecords.map((fileRecord) => {
		fileRecord.markForDelete();
		return fileRecord;
	});

	return markedFileRecords;
}

export function unmarkForDelete(fileRecords: FileRecord[]): FileRecord[] {
	const unmarkedFileRecords = fileRecords.map((fileRecord) => {
		fileRecord.unmarkForDelete();
		return fileRecord;
	});

	return unmarkedFileRecords;
}

export function createFileRecord(
	name: string,
	size: number,
	mimeType: string,
	params: FileRecordParams,
	userId: string
) {
	const entity = new FileRecord({
		size,
		name,
		mimeType,
		parentType: params.parentType,
		parentId: params.parentId,
		creatorId: userId,
		schoolId: params.schoolId,
	});

	return entity;
}

export function getFormat(mimeType: string): string {
	const format = mimeType.split('/')[1];

	return format;
}

export function getPreviewName(fileRecord: FileRecord, outputFormat?: PreviewOutputMimeTypes): string {
	if (!outputFormat) {
		return fileRecord.name;
	}

	const fileNameWithoutExtension = fileRecord.name.split('.')[0];
	const format = getFormat(outputFormat);
	const name = `${fileNameWithoutExtension}.${format}`;

	return name;
}
