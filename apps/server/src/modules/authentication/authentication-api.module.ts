import { Module } from '@nestjs/common';
import { SystemModule } from '@modules/system';
import { OauthModule } from '@modules/oauth/oauth.module';
import { AuthenticationModule } from './authentication.module';
import { LoginController, LogoutController } from './controllers';
import { LoginUc, LogoutUc } from './uc';

@Module({
	imports: [AuthenticationModule, SystemModule, OauthModule],
	providers: [LoginUc, LogoutUc],
	controllers: [LoginController, LogoutController],
})
export class AuthenticationApiModule {}
