import { BoardModule } from '@modules/board';
import { LearnroomModule } from '@modules/learnroom';
import { LegacySchoolModule } from '@modules/legacy-school';
import { PseudonymModule } from '@modules/pseudonym';
import { UserModule } from '@modules/user';
import { forwardRef, Module } from '@nestjs/common';
import { CommonToolModule } from '../common';
import { ContextExternalToolModule } from '../context-external-tool';
import { ExternalToolModule } from '../external-tool';
import { SchoolExternalToolModule } from '../school-external-tool';
import { Lti11EncryptionService, ToolLaunchService } from './service';
import {
	AutoContextIdStrategy,
	AutoContextNameStrategy,
	AutoMediumIdStrategy,
	AutoSchoolIdStrategy,
	AutoSchoolNumberStrategy,
	AutoMoinSchuleGroupUuidStrategy,
} from './service/auto-parameter-strategy';
import { BasicToolLaunchStrategy, Lti11ToolLaunchStrategy, OAuth2ToolLaunchStrategy } from './service/launch-strategy';

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
		BoardModule,
	],
	providers: [
		ToolLaunchService,
		Lti11EncryptionService,
		BasicToolLaunchStrategy,
		Lti11ToolLaunchStrategy,
		OAuth2ToolLaunchStrategy,
		AutoContextIdStrategy,
		AutoContextNameStrategy,
		AutoSchoolIdStrategy,
		AutoSchoolNumberStrategy,
		AutoMediumIdStrategy,
		AutoMoinSchuleGroupUuidStrategy,
	],
	exports: [ToolLaunchService],
})
export class ToolLaunchModule {}
