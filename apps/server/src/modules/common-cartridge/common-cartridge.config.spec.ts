import { CommonCartridgeConfig, config } from './common-cartridge.config';

describe('commonCartridgeConfig', () => {
	describe('when called', () => {
		it('should return config with proper values', () => {
			const result = config();

			expect(result).toStrictEqual<CommonCartridgeConfig>({
				INCOMING_REQUEST_TIMEOUT: expect.any(Number),
				FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_MAX_FILE_SIZE: expect.any(Number),
				API_HOST: expect.any(String),
			});
		});
	});
});
