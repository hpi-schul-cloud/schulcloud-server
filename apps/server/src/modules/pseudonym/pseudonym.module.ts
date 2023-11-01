import { forwardRef, Module } from '@nestjs/common';
import { LegacyLogger } from '@src/core/logger';
import { LearnroomModule } from '@modules/learnroom';
import { UserModule } from '@modules/user';
import { ToolModule } from '@modules/tool';
import { AuthorizationModule } from '@modules/authorization';
import { ExternalToolPseudonymRepo, PseudonymsRepo } from './repo';
import { FeathersRosterService, PseudonymService } from './service';

@Module({
	imports: [UserModule, LearnroomModule, forwardRef(() => ToolModule), forwardRef(() => AuthorizationModule)],
	providers: [PseudonymService, PseudonymsRepo, ExternalToolPseudonymRepo, LegacyLogger, FeathersRosterService],
	exports: [PseudonymService, FeathersRosterService],
})
export class PseudonymModule {}
