import { CommonCartridgeGuard } from './common-cartridge.guard';

describe('CommonCartridgeGuard', () => {
	describe('checkIntendedUse', () => {
		describe('when intended use is supported', () => {
			const supportedIntendedUses = ['use1', 'use2', 'use3'];

			it('should not throw an exception', () => {
				const intendedUse = 'use1';

				expect(() => {
					CommonCartridgeGuard.checkIntendedUse(intendedUse, supportedIntendedUses);
				}).not.toThrow();
			});
		});

		describe('when intended use is not supported', () => {
			const supportedIntendedUses = ['use1', 'use2', 'use3'];

			it('should throw an exception', () => {
				const intendedUse = 'use4';

				expect(() => {
					CommonCartridgeGuard.checkIntendedUse(intendedUse, supportedIntendedUses);
				}).toThrow();
			});
		});
	});
});
