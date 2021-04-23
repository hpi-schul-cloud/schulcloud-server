import { Module } from '@nestjs/common';
import { AuthorizationService } from './authorization.service';

@Module({
	providers: [AuthorizationService],
})
export class AuthorizationModule {}
