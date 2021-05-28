import { Module } from '@nestjs/common';
import { AuthorizationService } from './authorization.service';
import { FeathersAuthProvider } from './feathers-auth.provider';

@Module({
	providers: [AuthorizationService, FeathersAuthProvider],
	exports: [AuthorizationService],
})
export class AuthorizationModule {}
