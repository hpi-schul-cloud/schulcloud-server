import { Module } from '@nestjs/common';
import { NotificationModule } from './notification.module';
import { NotificationController } from './adapter/notification.controller';
import { NotificationObserverService } from './adapter/notification-observer.service';
import { LoggerModule } from '@core/logger';
import { AuthGuardModule, AuthGuardOptions, JWT_AUTH_GUARD_CONFIG_TOKEN, JwtAuthGuardConfig } from '@infra/auth-guard';
import { RegisterTimeoutConfig } from '@core/interceptor/register-timeout-config.decorator';
import { NOTIFICATION_TIMEOUT_CONFIG_TOKEN, NotificationTimeoutConfig } from './notification-timeout.config';
import { ConfigurationModule } from '@infra/configuration';

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
