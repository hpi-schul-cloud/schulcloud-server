import { forwardRef, Module } from '@nestjs/common';
import { LegacyLogger } from '@src/core/logger';
import { LearnroomModule } from '@src/modules/learnroom';
import { UserModule } from '@src/modules/user';
import { ToolModule } from '@src/modules/tool';
import { ExternalToolPseudonymRepo, PseudonymsRepo } from './repo';
import { FeathersRosterService, PseudonymService } from './service';

@Module({
	imports: [UserModule, LearnroomModule, forwardRef(() => ToolModule)],
	providers: [PseudonymService, PseudonymsRepo, ExternalToolPseudonymRepo, LegacyLogger, FeathersRosterService],
	exports: [PseudonymService, FeathersRosterService],
})
export class PseudonymModule {}
