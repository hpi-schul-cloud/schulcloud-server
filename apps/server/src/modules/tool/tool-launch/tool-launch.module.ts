import { Module } from '@nestjs/common';
import { PseudonymModule } from '@src/modules/pseudonym';
import { SchoolModule } from '@src/modules/school';
import { UserModule } from '@src/modules/user';
import { LearnroomModule } from '@src/modules/learnroom';
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
		SchoolModule,
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
