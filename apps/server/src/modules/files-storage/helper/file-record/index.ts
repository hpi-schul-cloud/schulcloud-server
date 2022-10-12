import { FileRecord } from '@shared/domain';
import { plainToClass } from 'class-transformer';
import { FileRecordParams } from '../../controller/dto';

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

// TODO: look like a mapper and should be located on this place, constructor for params added?
export function mapFileRecordToFileRecordParams(fileRecord: FileRecord): FileRecordParams {
	const fileRecordParams = plainToClass(FileRecordParams, {
		schoolId: fileRecord.schoolId,
		parentId: fileRecord.parentId,
		parentType: fileRecord.parentType,
	});

	return fileRecordParams;
}
