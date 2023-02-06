import { FileRecord } from '../domain';

// TODO: look like collection functions execute bash for array of fileRecords
export function markForDelete(fileRecords: FileRecord[]): FileRecord[] {
	const markedFileRecords = fileRecords.map((fileRecord) => {
		fileRecord.markForDelete();
		return fileRecord;
	});

	return markedFileRecords;
}

// TODO: look like collection functions execute bash for array of fileRecords
export function unmarkForDelete(fileRecords: FileRecord[]): FileRecord[] {
	const unmarkedFileRecords = fileRecords.map((fileRecord) => {
		fileRecord.unmarkForDelete();
		return fileRecord;
	});

	return unmarkedFileRecords;
}
