import { schulconnexProvisioningConfig, SchulconnexProvisioningConfig } from './schulconnex-provisioning.config';

describe('SchulconnexProvisioningConfig', () => {
	describe('when called', () => {
		it('should return config with proper values', () => {
			const result = schulconnexProvisioningConfig();

			expect(result).toEqual(
				expect.objectContaining<Partial<SchulconnexProvisioningConfig>>({
					INCOMING_REQUEST_TIMEOUT: expect.any(Number),
				})
			);
		});
	});
});
