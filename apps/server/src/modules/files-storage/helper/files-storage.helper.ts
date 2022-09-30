import { Injectable } from '@nestjs/common';
import { EntityId, FileRecord } from '@shared/domain';
import { ErrorStatus } from '../error';

@Injectable()
export class FilesStorageHelper {
	public createPath(schoolId: EntityId, fileRecordId: EntityId): string {
		if (!schoolId || !fileRecordId) {
			throw new Error(ErrorStatus.COULD_NOT_CREATE_PATH);
		}

		return [schoolId, fileRecordId].join('/');
	}

	public getPaths(fileRecords: FileRecord[]): string[] {
		if (fileRecords.length === 0) {
			throw new Error(ErrorStatus.EMPTY_FILE_RECORDS_ARRAY);
		}

		return fileRecords.map((fileRecord) => this.createPath(fileRecord.schoolId, fileRecord.id));
	}

	public markForDelete(fileRecords: FileRecord[]): FileRecord[] {
		const markedFileRecords = fileRecords.map((fileRecord) => {
			fileRecord.markForDelete();
			return fileRecord;
		});

		return markedFileRecords;
	}

	public isArrayEmpty(fileRecords: FileRecord[]): void {
		if (fileRecords.length === 0) {
			throw new Error(ErrorStatus.EMPTY_FILE_RECORDS_ARRAY);
		}
	}
}
