import { ScanResult } from '@infra/antivirus';
import { ScanStatus } from '../../domain';
import { ScanResultDto } from '../../domain/dto';
import { ScanResultDtoMapper } from './scan-result.mapper';

describe('ScanResultDtoMapper', () => {
	describe('fromScanResult()', () => {
		const buildParams = (virus_detected?: boolean, virus_signature?: string, error?: string): ScanResult => {
			const params = {
				virus_detected,
				virus_signature,
				error,
			};

			return params;
		};

		describe('When virus was detected with signature', () => {
			const setup = () => {
				const virusSignature = 'virus-signature';
				const params = buildParams(true, virusSignature);

				return { params, virusSignature };
			};

			it('returns correct dto', () => {
				const { params, virusSignature } = setup();
				const result = ScanResultDtoMapper.fromScanResult(params);

				const expectedResult: ScanResultDto = new ScanResultDto({
					status: ScanStatus.BLOCKED,
					reason: virusSignature,
				});
				expect(result).toEqual(expectedResult);
			});
		});

		describe('When virus was detected without signature', () => {
			it('returns correct dto', () => {
				const params = buildParams(true);

				const result = ScanResultDtoMapper.fromScanResult(params);

				const expectedResult: ScanResultDto = new ScanResultDto({
					status: ScanStatus.BLOCKED,
					reason: 'Virus detected',
				});
				expect(result).toEqual(expectedResult);
			});
		});

		describe('When scan result has error', () => {
			const setup = () => {
				const error = 'error-reason';
				const params = buildParams(undefined, undefined, error);

				return { params, error };
			};

			it('returns correct dto', () => {
				const { params, error } = setup();

				const result = ScanResultDtoMapper.fromScanResult(params);

				const expectedResult: ScanResultDto = new ScanResultDto({
					status: ScanStatus.ERROR,
					reason: error,
				});
				expect(result).toEqual(expectedResult);
			});
		});

		describe('When no virus was detected', () => {
			const setup = () => {
				const reason = 'Clean';
				const params = buildParams(false, reason);

				return { params, reason };
			};

			it('returns correct dto', () => {
				const { params, reason } = setup();

				const result = ScanResultDtoMapper.fromScanResult(params);

				const expectedResult: ScanResultDto = new ScanResultDto({
					status: ScanStatus.VERIFIED,
					reason,
				});
				expect(result).toEqual(expectedResult);
			});
		});

		describe('WHEN error property contains empty string', () => {
			it('returns correct dto', () => {
				const params = buildParams(undefined, undefined, '');

				const result = ScanResultDtoMapper.fromScanResult(params);

				const expectedResult: ScanResultDto = new ScanResultDto({
					status: ScanStatus.ERROR,
					reason: 'No scan result',
				});
				expect(result).toEqual(expectedResult);
			});
		});

		describe('WHEN empty scanResult is passed', () => {
			it('returns correct dto', () => {
				const params = {};

				const result = ScanResultDtoMapper.fromScanResult(params);

				const expectedResult: ScanResultDto = new ScanResultDto({
					status: ScanStatus.ERROR,
					reason: 'No scan result',
				});
				expect(result).toEqual(expectedResult);
			});
		});
	});
});
