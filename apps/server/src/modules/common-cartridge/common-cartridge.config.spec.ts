import { CommonCartridgeConfig, config } from './common-cartridge.config';

describe('commonCartridgeConfig', () => {
	describe('when called', () => {
		it('should return config with proper values', () => {
			const result = config();

			expect(result).toStrictEqual<CommonCartridgeConfig>({
				NEST_LOG_LEVEL: 'error',
			});
		});
	});
});
