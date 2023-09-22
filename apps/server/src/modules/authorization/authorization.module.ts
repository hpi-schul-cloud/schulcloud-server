import { Module } from '@nestjs/common';
import { ALL_RULES } from '@shared/domain/rules';
import { UserRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { FeathersModule } from '@shared/infra/feathers';
import { AuthorizationHelper } from './authorization.helper';
import { AuthorizationService } from './authorization.service';
import { FeathersAuthorizationService, FeathersAuthProvider } from './feathers';
import { RuleManager } from './rule-manager';

@Module({
	// TODO: remove forwardRef to TooModule N21-1055
	imports: [FeathersModule, LoggerModule],
	providers: [
		FeathersAuthorizationService,
		FeathersAuthProvider,
		AuthorizationService,
		...ALL_RULES,
		UserRepo,
		RuleManager,
		AuthorizationHelper,
	],
	exports: [FeathersAuthorizationService, AuthorizationService],
})
export class AuthorizationModule {}
