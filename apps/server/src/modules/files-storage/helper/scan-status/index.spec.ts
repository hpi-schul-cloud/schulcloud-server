import { ScanStatus } from '@shared/domain';
import { getStatusFromScanResult } from '.';
import { ScanResultParams } from '../../controller/dto';

describe('Scan Status Helper', () => {
	describe('getStatusFromScanResult is called', () => {
		describe('WHEN virus is detected', () => {
			const setup = () => {
				const scanResultParams: ScanResultParams = {
					virus_signature: 'bla',
					virus_detected: true,
				};

				return {
					scanResultParams,
				};
			};

			it('should return blocked scan status', () => {
				const { scanResultParams } = setup();

				const result = getStatusFromScanResult(scanResultParams);

				expect(result).toEqual(ScanStatus.BLOCKED);
			});
		});

		describe('WHEN no virus is detected', () => {
			const setup = () => {
				const scanResultParams: ScanResultParams = {
					virus_detected: false,
				};

				return {
					scanResultParams,
				};
			};

			it('should return blocked scan status', () => {
				const { scanResultParams } = setup();

				const result = getStatusFromScanResult(scanResultParams);

				expect(result).toEqual(ScanStatus.VERIFIED);
			});
		});

		describe('WHEN empty scanResult is passed', () => {
			const setup = () => {
				const scanResultParams = {};

				return {
					scanResultParams,
				};
			};

			it('should return blocked scan status', () => {
				const { scanResultParams } = setup();

				// @ts-expect-error type do not match
				const result = getStatusFromScanResult(scanResultParams);

				expect(result).toEqual(ScanStatus.BLOCKED);
			});
		});
	});
});
