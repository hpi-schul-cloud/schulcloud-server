import { ScanResultDto, ScanResultParams } from '../controller/dto';
import { ScanStatus } from '../entity';

export function mapScanResultParamsToDto(scanResultParams: ScanResultParams): ScanResultDto {
	const scanResult = new ScanResultDto({
		status: ScanStatus.VERIFIED,
		reason: 'Clean',
	});

	if (scanResultParams.virus_detected) {
		scanResult.status = ScanStatus.BLOCKED;
		scanResult.reason = scanResultParams.virus_signature ?? 'Virus detected';
	} else if (scanResultParams.error) {
		scanResult.status = ScanStatus.WONT_CHECK;
		scanResult.reason = scanResultParams.error;
	} else if (scanResultParams.virus_detected === undefined) {
		scanResult.status = ScanStatus.WONT_CHECK;
		scanResult.reason = 'No scan result';
	}

	return scanResult;
}
