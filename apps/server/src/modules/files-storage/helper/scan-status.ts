import { ScanResultParams } from '../controller/dto';
import { FileRecordDO, FileRecordDOParams, FileSecurityCheck, ScanStatus } from '../entity';

export function getStatusFromScanResult(scanResultParams: ScanResultParams): ScanStatus {
	const status = scanResultParams.virus_detected ? ScanStatus.BLOCKED : ScanStatus.VERIFIED;

	return status;
}

// TODO: undefined result is bad
export function deriveStatusFromSource(
	sourceFile: FileRecordDO,
	targetFileProps: FileRecordDOParams
): FileSecurityCheck | undefined {
	const securityCheck = sourceFile.isVerified() ? sourceFile.getSecurityCheck() : targetFileProps.securityCheck;

	return securityCheck;
}
