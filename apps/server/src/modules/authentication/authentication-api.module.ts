import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { AuthenticationModule } from './authentication.module';
import { LoginController, LogoutController } from './controllers';
import { LoginUc, LogoutUc } from './uc';

@Module({
	imports: [AuthenticationModule, LoggerModule],
	providers: [LoginUc, LogoutUc],
	controllers: [LoginController, LogoutController],
})
export class AuthenticationApiModule {}
