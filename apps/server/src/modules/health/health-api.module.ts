import { Module, type DynamicModule } from '@nestjs/common';

import { ConfigurationModule } from '@infra/configuration';
import { LoggerModule } from '@infra/logger';
import {
	SESSION_VALKEY_CLIENT_CONFIG_TOKEN,
	ValkeyClientModule,
	ValkeyClientSessionConfig,
} from '@infra/valkey-client';
import { HealthController } from './controller';
import { HEALTH_SESSION_STORAGE_CLIENT } from './health.constants';
import { HEALTH_CONFIG_TOKEN, HealthConfig } from './health.config';
import { HealthCheckRepo } from './repo';
import { HealthService } from './service';
import { HealthUC } from './uc';

@Module({
	imports: [LoggerModule, ConfigurationModule.register(HEALTH_CONFIG_TOKEN, HealthConfig)],
	controllers: [HealthController],
	providers: [HealthCheckRepo, HealthService, HealthUC],
})
export class HealthApiModule {
	public static registerWithSessionStorage(): DynamicModule {
		return {
			module: HealthApiModule,
			imports: [
				ValkeyClientModule.register({
					clientInjectionToken: HEALTH_SESSION_STORAGE_CLIENT,
					configInjectionToken: SESSION_VALKEY_CLIENT_CONFIG_TOKEN,
					configConstructor: ValkeyClientSessionConfig,
				}),
			],
		};
	}
}
