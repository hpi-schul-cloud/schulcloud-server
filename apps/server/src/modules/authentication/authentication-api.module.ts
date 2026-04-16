import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { Module } from '@nestjs/common';
import { AuthenticationModule } from './authentication.module';
import { LoginController, LogoutController } from './controllers';
import { LoginUc, LogoutUc } from './uc';
import { AUTHENTICATION_CONFIG_TOKEN, AuthenticationConfig } from './authentication-config';

@Module({
	imports: [
		AuthenticationModule,
		LoggerModule,
		ConfigurationModule.register(AUTHENTICATION_CONFIG_TOKEN, AuthenticationConfig),
	],
	providers: [LoginUc, LogoutUc],
	controllers: [LoginController, LogoutController],
})
export class AuthenticationApiModule {}
