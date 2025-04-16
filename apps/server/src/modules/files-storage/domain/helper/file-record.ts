import { InternalServerErrorException } from '@nestjs/common';
import { FileRecord } from '../file-record.do';
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

export function getFormat(mimeType: string): string {
	const format = mimeType.split('/')[1];

	if (!format) {
		throw new InternalServerErrorException(`could not get format from mime type: ${mimeType}`);
	}

	return format;
}

export function getPreviewName(fileRecord: FileRecord, outputFormat?: PreviewOutputMimeTypes): string {
	const props = fileRecord.getProps();
	const fileNameWithoutExtension = fileRecord.fileNameWithoutExtension;

	if (!outputFormat) {
		return props.name;
	}

	const format = getFormat(outputFormat);
	const previewFileName = `${fileNameWithoutExtension}.${format}`;

	return previewFileName;
}
