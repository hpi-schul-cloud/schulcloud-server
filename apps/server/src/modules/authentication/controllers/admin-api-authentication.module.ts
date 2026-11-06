import { Module } from '@nestjs/common';
import { AuthenticationApiModule } from '../authentication-api.module';
import { AdminApiSupportJwtController } from './admin-api-support-jwt.controller';

@Module({
	imports: [AuthenticationApiModule],
	controllers: [AdminApiSupportJwtController],
})
export class AdminApiAuthenticationModule {}
