import { FileRecord, FileSecurityCheck, ScanStatus } from '../entity';

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
