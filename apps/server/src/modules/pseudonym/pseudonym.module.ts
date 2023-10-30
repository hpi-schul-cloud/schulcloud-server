import { forwardRef, Module } from '@nestjs/common';
import { LegacyLogger } from '@src/core/logger/legacy-logger.service';
import { AuthorizationModule } from '../authorization/authorization.module';
import { LearnroomModule } from '../learnroom/learnroom.module';
import { ToolModule } from '../tool/tool.module';
import { UserModule } from '../user/user.module';
import { ExternalToolPseudonymRepo } from './repo/external-tool-pseudonym.repo';
import { PseudonymsRepo } from './repo/pseudonyms.repo';
import { FeathersRosterService } from './service/feathers-roster.service';
import { PseudonymService } from './service/pseudonym.service';

@Module({
	imports: [UserModule, LearnroomModule, forwardRef(() => ToolModule), forwardRef(() => AuthorizationModule)],
	providers: [PseudonymService, PseudonymsRepo, ExternalToolPseudonymRepo, LegacyLogger, FeathersRosterService],
	exports: [PseudonymService, FeathersRosterService],
})
export class PseudonymModule {}
