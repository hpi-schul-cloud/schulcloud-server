import { EncryptionModule } from '@infra/encryption';
import { BoardModule } from '@modules/board';
import { CourseModule } from '@modules/course';
import { GroupModule } from '@modules/group';
import { LegacySchoolModule } from '@modules/legacy-school';
import { PseudonymModule } from '@modules/pseudonym';
import { UserModule } from '@modules/user';
import { forwardRef, Module } from '@nestjs/common';
import { CommonToolModule } from '../common';
import { ContextExternalToolModule } from '../context-external-tool';
import { ExternalToolModule } from '../external-tool';
import { SchoolExternalToolModule } from '../school-external-tool';
import { ToolLaunchService } from './service';
import {
	AutoContextIdStrategy,
	AutoContextNameStrategy,
	AutoGroupExternalUuidStrategy,
	AutoMediumIdStrategy,
	AutoSchoolIdStrategy,
	AutoSchoolNumberStrategy,
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
		CourseModule,
		BoardModule,
		GroupModule,
		EncryptionModule,
	],
	providers: [
		ToolLaunchService,
		BasicToolLaunchStrategy,
		Lti11ToolLaunchStrategy,
		OAuth2ToolLaunchStrategy,
		AutoContextIdStrategy,
		AutoContextNameStrategy,
		AutoSchoolIdStrategy,
		AutoSchoolNumberStrategy,
		AutoMediumIdStrategy,
		AutoGroupExternalUuidStrategy,
	],
	exports: [ToolLaunchService],
})
export class ToolLaunchModule {}
