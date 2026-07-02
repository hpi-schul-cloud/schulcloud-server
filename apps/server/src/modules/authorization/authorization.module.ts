import { ConfigurationModule } from '@infra/configuration';
import { FeathersModule } from '@infra/feathers';
import { LoggerModule } from '@infra/logger';
import { Module } from '@nestjs/common';
import { AUTHORIZATION_CONFIG_TOKEN, AuthorizationConfig } from './authorization.config';
import { AuthorizationHelper, AuthorizationInjectionService, AuthorizationService, RuleManager } from './domain';
import { FeathersAuthorizationService, FeathersAuthProvider } from './feathers';

@Module({
	imports: [
		FeathersModule,
		LoggerModule,
		ConfigurationModule.register(AUTHORIZATION_CONFIG_TOKEN, AuthorizationConfig),
	],
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
