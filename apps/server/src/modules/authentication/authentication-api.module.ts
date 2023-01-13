import { Module } from '@nestjs/common';
import { AuthenticationModule } from './authentication.module';
import { LoginController } from './controllers/login.controller';

@Module({
	imports: [AuthenticationModule],
	providers: [],
	controllers: [LoginController],
	exports: [],
})
export class AuthenticationApiModule {}
