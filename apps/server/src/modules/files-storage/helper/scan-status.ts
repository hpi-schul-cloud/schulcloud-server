import { ScanResultParams } from '../controller/dto';
import { FileRecord, FileSecurityCheck, ScanStatus } from '../entity';

export function getScanResult(scanResultParams: ScanResultParams) {
	const scanResultDto = {
		status: ScanStatus.PENDING,
		reason: undefined,
	};
	if (scanResultParams.virus_detected) {
		scanResultDto.status = ScanStatus.BLOCKED;
		scanResultDto.reason = scanResultParams.virus_signature;
	} else if (scanResultParams.error) {
		scanResultDto.status = ScanStatus.WONT_CHECK;
		scanResultDto.reason = scanResultParams.error;
	} else {
		scanResultDto.status = ScanStatus.VERIFIED;
	}

	return scanResultDto;
}

export function deriveStatusFromSource(sourceFile: FileRecord, targetFile: FileRecord): FileSecurityCheck {
	if (sourceFile.securityCheck.status === ScanStatus.VERIFIED) {
		return sourceFile.securityCheck;
	}

	return targetFile.securityCheck;
}

export function isStatusBlocked(fileRecord: FileRecord): boolean {
	const isBlocked = fileRecord.securityCheck.status === ScanStatus.BLOCKED;

	return isBlocked;
}
