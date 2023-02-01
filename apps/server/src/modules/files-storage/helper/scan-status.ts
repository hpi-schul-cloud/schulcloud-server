import { FileRecord, FileSecurityCheck } from '../entity';

export function deriveStatusFromSource(sourceFile: FileRecord, targetFile: FileRecord): FileSecurityCheck {
	const securityCheck = sourceFile.isVerified() ? sourceFile.securityCheck : targetFile.securityCheck;

	return securityCheck;
}
