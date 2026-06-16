import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { Module } from '@nestjs/common';
import { AUTHENTICATION_CONFIG_TOKEN, AuthenticationConfig } from './authentication-config';
import { AuthenticationModule } from './authentication.module';
import { LoginController, LogoutController, SessionController } from './controllers';
import { LoginUc, LogoutUc, SessionUc } from './uc';

@Module({
	imports: [
		AuthenticationModule,
		LoggerModule,
		ConfigurationModule.register(AUTHENTICATION_CONFIG_TOKEN, AuthenticationConfig),
	],
	providers: [LoginUc, LogoutUc, SessionUc],
	controllers: [LoginController, LogoutController, SessionController],
})
export class AuthenticationApiModule {}
