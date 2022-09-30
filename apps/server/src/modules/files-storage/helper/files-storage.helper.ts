import { Injectable } from '@nestjs/common';
import { EntityId, FileRecord } from '@shared/domain';

@Injectable()
export class FilesStorageHelper {
	public createPath(schoolId: EntityId, fileRecordId: EntityId): string {
		if (!schoolId || !fileRecordId) {
			throw new Error(`Couldn't create path. SchoolId or FileRecordId is empty.`);
		}

		return [schoolId, fileRecordId].join('/');
	}

	public getPaths(fileRecords: FileRecord[]): string[] {
		if (fileRecords.length === 0) {
			throw new Error(`FileRecordsArray is empty. Couldn't get paths.`);
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

	public unmarkForDelete(fileRecords: FileRecord[]): FileRecord[] {
		const unmarkedFileRecords = fileRecords.map((fileRecord) => {
			fileRecord.unmarkForDelete();
			return fileRecord;
		});

		return unmarkedFileRecords;
	}
}
