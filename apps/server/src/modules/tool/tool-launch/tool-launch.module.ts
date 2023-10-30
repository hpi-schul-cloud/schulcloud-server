import { Module } from '@nestjs/common';
import { LearnroomModule } from '@src/modules/learnroom/learnroom.module';
import { LegacySchoolModule } from '@src/modules/legacy-school/legacy-school.module';
import { PseudonymModule } from '@src/modules/pseudonym/pseudonym.module';
import { UserModule } from '@src/modules/user/user.module';
import { CommonToolModule } from '../common/common-tool.module';
import { ContextExternalToolModule } from '../context-external-tool/context-external-tool.module';
import { ExternalToolModule } from '../external-tool/external-tool.module';
import { SchoolExternalToolModule } from '../school-external-tool/school-external-tool.module';
import { Lti11EncryptionService } from './service/lti11-encryption.service';
import { BasicToolLaunchStrategy } from './service/strategy/basic-tool-launch.strategy';
import { Lti11ToolLaunchStrategy } from './service/strategy/lti11-tool-launch.strategy';
import { OAuth2ToolLaunchStrategy } from './service/strategy/oauth2-tool-launch.strategy';
import { ToolLaunchService } from './service/tool-launch.service';

@Module({
	imports: [
		CommonToolModule,
		ExternalToolModule,
		SchoolExternalToolModule,
		ContextExternalToolModule,
		LegacySchoolModule,
		UserModule,
		PseudonymModule,
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
