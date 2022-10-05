import { ConflictException, Injectable } from '@nestjs/common';
import { EntityId, FileRecord } from '@shared/domain';
import { FileRecordParams } from '../controller/dto';
import { ErrorStatus } from '../error';
import { ErrorType } from '../files-storage.const';

@Injectable()
export class FilesStorageHelper {
	public createPath(schoolId: EntityId, fileRecordId: EntityId): string {
		if (!schoolId || !fileRecordId) {
			throw new Error(ErrorStatus.COULD_NOT_CREATE_PATH);
		}

		return [schoolId, fileRecordId].join('/');
	}

	public getPaths(fileRecords: FileRecord[]): string[] {
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

	public checkDuplicatedNames(fileRecords: FileRecord[], newFileName: string): void {
		if (fileRecords.find((item) => item.name === newFileName)) {
			throw new ConflictException(ErrorType.FILE_NAME_EXISTS);
		}
	}

	public modifiedFileNameInScope(
		fileRecord: FileRecord,
		fileRecordsInScope: FileRecord[],
		newFileName: string
	): FileRecord {
		this.checkDuplicatedNames(fileRecordsInScope, newFileName);
		fileRecord.name = newFileName;

		return fileRecord;
	}

	public mapFileRecordToFileRecordParams(fileRecord: FileRecord): FileRecordParams {
		const fileRecordParams: FileRecordParams = {
			schoolId: fileRecord.schoolId,
			parentId: fileRecord.parentId,
			parentType: fileRecord.parentType,
		};

		return fileRecordParams;
	}
}
