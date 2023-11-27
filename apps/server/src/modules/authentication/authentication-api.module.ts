import { Module } from '@nestjs/common';
import { AuthenticationModule } from './authentication.module';
import { LoginController } from './controllers/login.controller';
import { LoginUc } from './uc/login.uc';

@Module({
	imports: [AuthenticationModule],
	providers: [LoginUc],
	controllers: [LoginController],
	exports: [],
})
export class AuthenticationApiModule {}
