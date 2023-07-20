import { forwardRef, Module } from '@nestjs/common';
import { EncryptionModule } from '@shared/infra/encryption';
import { OauthProviderServiceModule } from '@shared/infra/oauth-provider';
import {
	ContextExternalToolRepo,
	CourseRepo,
	ExternalToolRepo,
	ExternalToolRepoMapper,
	ExternalToolSortingMapper,
	PseudonymsRepo,
	SchoolExternalToolRepo,
} from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '@src/modules/authorization';
import { PseudonymModule } from '@src/modules/pseudonym';
import { SchoolModule } from '@src/modules/school';
import { UserModule } from '@src/modules/user';
import { Lti11EncryptionService, ToolLaunchService } from './launch-tool/service';
import {
	BasicToolLaunchStrategy,
	Lti11ToolLaunchStrategy,
	OAuth2ToolLaunchStrategy,
} from './launch-tool/service/strategy';
import {
	CommonToolService,
	CommonToolValidationService,
	ContextExternalToolService,
	ContextExternalToolValidationService,
	ExternalToolService,
	ExternalToolServiceMapper,
	ExternalToolValidationService,
	ExternalToolVersionService,
	SchoolExternalToolService,
	SchoolExternalToolValidationService,
} from './service';

@Module({
	imports: [
		LoggerModule,
		OauthProviderServiceModule,
		EncryptionModule,
		forwardRef(() => AuthorizationModule),
		UserModule,
		PseudonymModule,
		SchoolModule,
	],
	providers: [
		ExternalToolService,
		ExternalToolServiceMapper,
		PseudonymsRepo,
		ExternalToolRepo,
		ExternalToolRepoMapper,
		ExternalToolSortingMapper,
		SchoolExternalToolRepo,
		ContextExternalToolRepo,
		ExternalToolValidationService,
		ExternalToolVersionService,
		SchoolExternalToolService,
		ContextExternalToolService,
		CommonToolValidationService,
		SchoolExternalToolValidationService,
		ContextExternalToolValidationService,
		ToolLaunchService,
		Lti11EncryptionService,
		BasicToolLaunchStrategy,
		Lti11ToolLaunchStrategy,
		OAuth2ToolLaunchStrategy,
		CommonToolService,
		// Importing the LearnroomModule instead of CourseRepo creates some kind of dependency cycle that lets unrelated tests fail
		CourseRepo,
	],
	exports: [
		ExternalToolService,
		ExternalToolValidationService,
		SchoolExternalToolService,
		ContextExternalToolService,
		ExternalToolRepoMapper,
		CommonToolValidationService,
		SchoolExternalToolValidationService,
		ContextExternalToolValidationService,
		ToolLaunchService,
		CommonToolService,
	],
})
export class ToolModule {}
