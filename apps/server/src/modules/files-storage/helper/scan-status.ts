import { FileRecord, FileSecurityCheck, ScanStatus } from '@shared/domain';
import { ScanResultParams } from '../controller/dto';

export function getStatusFromScanResult(scanResultParams: ScanResultParams): ScanStatus {
	const status = scanResultParams.virus_detected ? ScanStatus.BLOCKED : ScanStatus.VERIFIED;

	return status;
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
