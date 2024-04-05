import { LearnroomModule } from '@modules/learnroom';
import { ToolModule } from '@modules/tool';
import { UserModule } from '@modules/user';
import { forwardRef, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { LegacyLogger, LoggerModule } from '@src/core/logger';
import { ExternalToolPseudonymRepo, PseudonymsRepo } from './repo';
import { FeathersRosterService, PseudonymService } from './service';

@Module({
	imports: [UserModule, LearnroomModule, forwardRef(() => ToolModule), LoggerModule, CqrsModule],
	providers: [PseudonymService, PseudonymsRepo, ExternalToolPseudonymRepo, LegacyLogger, FeathersRosterService],
	exports: [PseudonymService, FeathersRosterService],
})
export class PseudonymModule {}
