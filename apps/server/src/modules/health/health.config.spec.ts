import { HealthConfig } from './health.config';

describe(HealthConfig.name, () => {
	it('includes both datastore checks by default', () => {
		const config = new HealthConfig();

		expect(config.excludeMongoDB).toBe(false);
		expect(config.excludeSessionStorage).toBe(false);
	});
});
