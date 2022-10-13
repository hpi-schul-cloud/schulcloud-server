import { ConflictException, Injectable } from '@nestjs/common';
import { EntityId, FileRecord, ScanStatus } from '@shared/domain';
import { plainToClass } from 'class-transformer';
import { FileRecordParams, ScanResultParams } from '../controller/dto';
import { ErrorType } from '../error';

// TODO:
// we should evaluate how we structure helper,
// helper classes, should they be injectable or should we export functions only
@Injectable()
export class FilesStorageHelper {
	public createPath(schoolId: EntityId, fileRecordId: EntityId): string {
		if (!schoolId || !fileRecordId) {
			throw new Error(ErrorType.COULD_NOT_CREATE_PATH);
		}

		return [schoolId, fileRecordId].join('/');
	}

	public getPaths(fileRecords: FileRecord[]): string[] {
		const paths = fileRecords.map((fileRecord) => this.createPath(fileRecord.schoolId, fileRecord.id));

		return paths;
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

	public modifyFileNameInScope(
		fileRecord: FileRecord,
		fileRecordsInScope: FileRecord[],
		newFileName: string
	): FileRecord {
		this.checkDuplicatedNames(fileRecordsInScope, newFileName);
		fileRecord.name = newFileName;

		return fileRecord;
	}

	// TODO: look like a mapper and should be located on this place, constructor for params added?
	public mapFileRecordToFileRecordParams(fileRecord: FileRecord): FileRecordParams {
		const fileRecordParams = plainToClass(FileRecordParams, {
			schoolId: fileRecord.schoolId,
			parentId: fileRecord.parentId,
			parentType: fileRecord.parentType,
		});

		return fileRecordParams;
	}

	public getStatusFromScanResult(scanResultParams: ScanResultParams): ScanStatus {
		const status =
			scanResultParams.virus_detected === undefined || scanResultParams.virus_detected
				? ScanStatus.BLOCKED
				: ScanStatus.VERIFIED;

		return status;
	}
}
