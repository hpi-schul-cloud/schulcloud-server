import { Module } from '@nestjs/common';
import { SchoolModule } from '@src/modules/school-migration';
import { UserModule } from '@src/modules/user';
import { PseudonymModule } from '@src/modules/pseudonym';
import { CourseRepo } from '@shared/repo';
import { Lti11EncryptionService, ToolLaunchService } from './service';
import { SchoolExternalToolModule } from '../school-external-tool';
import { ExternalToolModule } from '../external-tool';
import { ContextExternalToolModule } from '../context-external-tool';
import { BasicToolLaunchStrategy, Lti11ToolLaunchStrategy, OAuth2ToolLaunchStrategy } from './service/strategy';
import { CommonToolModule } from '../common';

@Module({
	imports: [
		CommonToolModule,
		ExternalToolModule,
		SchoolExternalToolModule,
		ContextExternalToolModule,
		SchoolModule,
		UserModule,
		PseudonymModule,
	],
	providers: [
		ToolLaunchService,
		BasicToolLaunchStrategy,
		Lti11ToolLaunchStrategy,
		OAuth2ToolLaunchStrategy,
		Lti11EncryptionService,
		// Importing the LearnroomModule instead of CourseRepo creates some kind of dependency cycle that lets unrelated tests fail
		CourseRepo,
	],
	exports: [ToolLaunchService],
})
export class ToolLaunchModule {}
