import { LoggerModule } from '@core/logger';
import { FeathersModule } from '@infra/feathers';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { AuthorizationHelper, AuthorizationInjectionService, AuthorizationService, RuleManager } from './domain';
import { FeathersAuthorizationService, FeathersAuthProvider } from './feathers';

@Module({
	imports: [FeathersModule, LoggerModule, UserModule],
	providers: [
		FeathersAuthorizationService,
		AuthorizationInjectionService,
		FeathersAuthProvider,
		AuthorizationService,
		RuleManager,
		AuthorizationHelper,
	],
	exports: [FeathersAuthorizationService, AuthorizationService, AuthorizationInjectionService, AuthorizationHelper],
})
export class AuthorizationModule {}
