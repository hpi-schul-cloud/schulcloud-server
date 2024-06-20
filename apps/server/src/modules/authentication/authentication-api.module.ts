import { Module } from '@nestjs/common';
import { AccountModule } from '../account';
import { AuthenticationModule } from './authentication.module';
import { LoginController } from './controllers/login.controller';
import { LoginUc } from './uc/login.uc';

@Module({
	imports: [AuthenticationModule, AccountModule],
	providers: [LoginUc],
	controllers: [LoginController],
	exports: [],
})
export class AuthenticationApiModule {}
