import { ScanResult } from '@infra/antivirus';
import { ScanResultDto } from '../dto';
import { ScanStatus } from '../file-record.do';

export class ScanResultDtoMapper {
	public static fromScanResult(scanResult: ScanResult): ScanResultDto {
		if (scanResult.virus_detected) {
			return this.blockedResult(scanResult.virus_signature);
		} else if (scanResult.error) {
			return this.errorResult(scanResult.error);
		} else if (scanResult.virus_detected === undefined || scanResult.error === '') {
			return this.noScanResult();
		} else {
			return this.verifiedResult();
		}
	}

	private static verifiedResult(): ScanResultDto {
		return new ScanResultDto({
			status: ScanStatus.VERIFIED,
			reason: 'Clean',
		});
	}

	private static blockedResult(virus_signature?: string): ScanResultDto {
		return new ScanResultDto({
			status: ScanStatus.BLOCKED,
			reason: virus_signature ?? 'Virus detected',
		});
	}

	private static errorResult(error: string): ScanResultDto {
		return new ScanResultDto({
			status: ScanStatus.ERROR,
			reason: error,
		});
	}

	private static noScanResult(): ScanResultDto {
		return new ScanResultDto({
			status: ScanStatus.ERROR,
			reason: 'No scan result',
		});
	}
}
