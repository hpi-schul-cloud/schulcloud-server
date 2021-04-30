import { Module } from '@nestjs/common';
import { AuthorizationService } from './authorization.service';
import { FeathersServiceProvider } from './feathers-service.provider';

@Module({
	providers: [AuthorizationService, FeathersServiceProvider],
	exports: [AuthorizationService],
})
export class AuthorizationModule {}
