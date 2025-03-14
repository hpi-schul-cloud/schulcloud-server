import {
	DeleteByStorageLocationResponse,
	FileRecordListResponse,
	FileRecordResponse,
	ScanResultDto,
	ScanResultParams,
} from '../controller/dto';
import { FileRecord, ScanStatus } from '../entity';
import { StorageLocationParams } from '../interface';

export class FileRecordMapper {
	public static mapToFileRecordResponse(fileRecord: FileRecord): FileRecordResponse {
		const fileRecordResponse = new FileRecordResponse(fileRecord);

		return fileRecordResponse;
	}

	public static mapToFileRecordListResponse(
		fileRecords: FileRecord[],
		total: number,
		skip?: number,
		limit?: number
	): FileRecordListResponse {
		const responseFileRecords = fileRecords.map((fileRecord) => FileRecordMapper.mapToFileRecordResponse(fileRecord));
		const response = new FileRecordListResponse(responseFileRecords, total, skip, limit);

		return response;
	}

	public static mapScanResultParamsToDto(scanResultParams: ScanResultParams): ScanResultDto {
		const scanResult = new ScanResultDto({
			status: ScanStatus.VERIFIED,
			reason: 'Clean',
		});

		if (scanResultParams.virus_detected) {
			scanResult.status = ScanStatus.BLOCKED;
			scanResult.reason = scanResultParams.virus_signature ?? 'Virus detected';
		} else if (scanResultParams.error) {
			scanResult.status = ScanStatus.ERROR;
			scanResult.reason = scanResultParams.error;
		} else if (scanResultParams.virus_detected === undefined || scanResultParams.error === '') {
			scanResult.status = ScanStatus.ERROR;
			scanResult.reason = 'No scan result';
		}

		return scanResult;
	}

	public static mapToDeleteByStorageLocationResponse(
		params: StorageLocationParams,
		deletedFiles: number
	): DeleteByStorageLocationResponse {
		const response = new DeleteByStorageLocationResponse({ ...params, deletedFiles });

		return response;
	}
}
