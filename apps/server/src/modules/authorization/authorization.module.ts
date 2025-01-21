import { FeathersModule } from '@infra/feathers';
import { Module } from '@nestjs/common';
import { UserRepo } from '@shared/repo/user';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationHelper, AuthorizationInjectionService, AuthorizationService, RuleManager } from './domain';
import { FeathersAuthorizationService, FeathersAuthProvider } from './feathers';

@Module({
	imports: [FeathersModule, LoggerModule],
	providers: [
		FeathersAuthorizationService,
		AuthorizationInjectionService,
		FeathersAuthProvider,
		AuthorizationService,
		UserRepo,
		RuleManager,
		AuthorizationHelper,
	],
	exports: [FeathersAuthorizationService, AuthorizationService, AuthorizationInjectionService, AuthorizationHelper],
})
export class AuthorizationModule {}
