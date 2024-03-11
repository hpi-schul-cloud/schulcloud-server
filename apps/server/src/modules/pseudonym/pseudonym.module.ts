import { LearnroomModule } from '@modules/learnroom';
import { ToolModule } from '@modules/tool';
import { UserModule } from '@modules/user/user.module';
import { forwardRef, Module } from '@nestjs/common';
import { LegacyLogger, LoggerModule } from '@src/core/logger';
import { ExternalToolPseudonymRepo, PseudonymsRepo } from './repo';
import { FeathersRosterService, PseudonymService } from './service';

@Module({
	imports: [UserModule, LearnroomModule, forwardRef(() => ToolModule), LoggerModule],
	providers: [PseudonymService, PseudonymsRepo, ExternalToolPseudonymRepo, LegacyLogger, FeathersRosterService],
	exports: [PseudonymService, FeathersRosterService],
})
export class PseudonymModule {}
