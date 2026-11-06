import { SESSION_VALKEY_CLIENT_CONFIG_TOKEN, ValkeyClientModule } from '@infra/valkey-client';
import { type DynamicModule } from '@nestjs/common';
import { HealthApiModule } from './health-api.module';
import { HEALTH_SESSION_STORAGE_CLIENT } from './health.constants';

describe(HealthApiModule.name, () => {
	it('registers the session-storage client for health checks', () => {
		const dynamicModule = HealthApiModule.registerWithSessionStorage();
		const valkeyModule = dynamicModule.imports?.[0] as DynamicModule;

		expect(dynamicModule.module).toBe(HealthApiModule);
		expect(dynamicModule.imports).toHaveLength(1);
		expect(valkeyModule.module).toBe(ValkeyClientModule);
		expect(valkeyModule.providers).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					provide: HEALTH_SESSION_STORAGE_CLIENT,
					inject: expect.arrayContaining([SESSION_VALKEY_CLIENT_CONFIG_TOKEN]),
				}),
			])
		);
		expect(valkeyModule.imports).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					module: expect.any(Function),
					providers: expect.arrayContaining([expect.objectContaining({ provide: SESSION_VALKEY_CLIENT_CONFIG_TOKEN })]),
				}),
			])
		);
	});
});
