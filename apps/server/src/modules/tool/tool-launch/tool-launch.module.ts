import { Module, forwardRef } from '@nestjs/common';
import { LearnroomModule } from '@src/modules/learnroom';
import { LegacySchoolModule } from '@src/modules/legacy-school';
import { PseudonymModule } from '@src/modules/pseudonym';
import { UserModule } from '@src/modules/user';
import { CommonToolModule } from '../common';
import { ContextExternalToolModule } from '../context-external-tool';
import { ExternalToolModule } from '../external-tool';
import { SchoolExternalToolModule } from '../school-external-tool';
import { Lti11EncryptionService, ToolLaunchService } from './service';
import { BasicToolLaunchStrategy, Lti11ToolLaunchStrategy, OAuth2ToolLaunchStrategy } from './service/strategy';

@Module({
	imports: [
		CommonToolModule,
		ExternalToolModule,
		SchoolExternalToolModule,
		ContextExternalToolModule,
		LegacySchoolModule,
		UserModule,
		forwardRef(() => PseudonymModule), // i do not like this solution, the root problem is on other place but not detectable for me
		LearnroomModule,
	],
	providers: [
		ToolLaunchService,
		BasicToolLaunchStrategy,
		Lti11ToolLaunchStrategy,
		OAuth2ToolLaunchStrategy,
		Lti11EncryptionService,
	],
	exports: [ToolLaunchService],
})
export class ToolLaunchModule {}
