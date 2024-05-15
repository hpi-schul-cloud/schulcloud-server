import { systemFactory } from '@shared/testing/factory';

describe('System', () => {
	describe('isDeletable', () => {
		describe('when ldapConfig provider is "general"', () => {
			it('should return true', () => {
				const system = systemFactory.build({ ldapConfig: { provider: 'general' } });

				const result = system.isDeletable();

				expect(result).toBe(true);
			});
		});

		describe('when ldapConfig provider is not "general"', () => {
			it('should return true', () => {
				const system = systemFactory.build({ ldapConfig: {} });

				const result = system.isDeletable();

				expect(result).toBe(false);
			});
		});
	});
});
