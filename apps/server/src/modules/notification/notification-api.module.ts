import { RegisterTimeoutConfig } from '@core/interceptor/register-timeout-config.decorator';
import { AuthGuardModule, AuthGuardOptions, JWT_AUTH_GUARD_CONFIG_TOKEN, JwtAuthGuardConfig } from '@infra/auth-guard';
import { ConfigurationModule } from '@infra/configuration';
import { LoggerModule } from '@infra/logger';
import { Module } from '@nestjs/common';
import { NotificationObserverService } from './adapter/notification-observer.service';
import { NotificationController } from './adapter/notification.controller';
import { NOTIFICATION_TIMEOUT_CONFIG_TOKEN, NotificationTimeoutConfig } from './notification-timeout.config';
import { NotificationModule } from './notification.module';

@Module({
	imports: [
		NotificationModule,
		LoggerModule,
		AuthGuardModule.register([
			{
				option: AuthGuardOptions.JWT,
				configInjectionToken: JWT_AUTH_GUARD_CONFIG_TOKEN,
				configConstructor: JwtAuthGuardConfig,
			},
		]),
		ConfigurationModule.register(NOTIFICATION_TIMEOUT_CONFIG_TOKEN, NotificationTimeoutConfig),
	],
	controllers: [NotificationController],
	providers: [NotificationObserverService],
})
@RegisterTimeoutConfig(NOTIFICATION_TIMEOUT_CONFIG_TOKEN)
export class NotificationApiModule {}
