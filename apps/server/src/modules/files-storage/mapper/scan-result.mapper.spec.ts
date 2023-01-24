import { ScanResultDto, ScanResultParams } from '../controller/dto';
import { ScanStatus } from '../entity';
import { mapScanResultParamsToDto } from './scan-result.mapper';

describe('Scan Result Mapper', () => {
	const buildParams = (virus_detected: boolean, virus_signature?: string, error?: string): ScanResultParams => {
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
			const result = mapScanResultParamsToDto(params);

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

			const result = mapScanResultParamsToDto(params);

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
			const params = buildParams(false, undefined, error);

			return { params, error };
		};

		it('returns correct dto', () => {
			const { params, error } = setup();

			const result = mapScanResultParamsToDto(params);

			const expectedResult: ScanResultDto = new ScanResultDto({
				status: ScanStatus.WONT_CHECK,
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

			const result = mapScanResultParamsToDto(params);

			const expectedResult: ScanResultDto = new ScanResultDto({
				status: ScanStatus.VERIFIED,
				reason,
			});
			expect(result).toEqual(expectedResult);
		});
	});

	describe('WHEN empty scanResult is passed', () => {
		it('returns correct dto', () => {
			const params = {};

			// @ts-expect-error type do not match
			const result = mapScanResultParamsToDto(params);

			const expectedResult: ScanResultDto = new ScanResultDto({
				status: ScanStatus.WONT_CHECK,
				reason: 'No scan result',
			});
			expect(result).toEqual(expectedResult);
		});
	});
});
