import { ScanStatus } from '@shared/domain';
import { ScanResultParams } from '../../controller/dto';

export function getStatusFromScanResult(scanResultParams: ScanResultParams): ScanStatus {
	const status =
		scanResultParams.virus_detected === undefined || scanResultParams.virus_detected
			? ScanStatus.BLOCKED
			: ScanStatus.VERIFIED;

	return status;
}
