import { LoggerModule } from '@core/logger';
import { Module } from '@nestjs/common';
import { AuthenticationTestModule } from './authentication-test.module';
import { LoginController, LogoutController } from './controllers';
import { LoginUc, LogoutUc } from './uc';

// This module is for use in api tests of other apps than the core server.
@Module({
	imports: [AuthenticationTestModule, LoggerModule],
	providers: [LoginUc, LogoutUc],
	controllers: [LoginController, LogoutController],
})
export class AuthenticationApiTestModule {}
