import { BoardModule } from '@modules/board';
import { LearnroomModule } from '@modules/learnroom';
import { PseudonymModule } from '@modules/pseudonym';
import { ToolModule } from '@modules/tool';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { FeathersRosterService } from './service';

@Module({
	imports: [PseudonymModule, UserModule, LearnroomModule, ToolModule, BoardModule],
	providers: [FeathersRosterService],
	exports: [FeathersRosterService],
})
export class RosterModule {}
