import { FileRecord, FileSecurityCheck } from '../entity';

export function deriveStatusFromSource(sourceFile: FileRecord, targetFile: FileRecord): FileSecurityCheck {
	if (sourceFile.isVerified()) {
		return sourceFile.securityCheck;
	}

	return targetFile.securityCheck;
}
