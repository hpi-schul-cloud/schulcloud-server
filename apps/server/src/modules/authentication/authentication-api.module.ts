import { ConfigurationModule } from '@infra/configuration';
import { LoggerModule } from '@infra/logger';
import { AuthorizationModule } from '@modules/authorization';
import { UserModule } from '@modules/user/user.module';
import { Module } from '@nestjs/common';
import { AUTHENTICATION_CONFIG_TOKEN, AuthenticationConfig } from './authentication-config';
import { AuthenticationModule } from './authentication.module';
import { LoginController, LogoutController } from './controllers';
import { LoginUc, LogoutUc } from './uc';

@Module({
	imports: [
		UserModule,
		AuthenticationModule,
		AuthorizationModule,
		LoggerModule,
		ConfigurationModule.register(AUTHENTICATION_CONFIG_TOKEN, AuthenticationConfig),
	],
	providers: [LoginUc, LogoutUc],
	controllers: [LoginController, LogoutController],
})
export class AuthenticationApiModule {}
