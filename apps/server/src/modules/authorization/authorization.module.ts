import { Module } from '@nestjs/common';
import { AuthorizationService } from './authorization.service';
import { FeathersAuthProvider } from './feathers-auth.provider';
import { FeathersServiceProvider } from './feathers-service.provider';

@Module({
	providers: [AuthorizationService, FeathersServiceProvider, FeathersAuthProvider],
	exports: [AuthorizationService],
})
export class AuthorizationModule {}
