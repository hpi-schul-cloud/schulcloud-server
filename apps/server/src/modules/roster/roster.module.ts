import { BoardModule } from '@modules/board';
import { CourseModule } from '@modules/course';
import { PseudonymModule } from '@modules/pseudonym';
import { ToolModule } from '@modules/tool';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { FeathersRosterService } from './service';

@Module({
	imports: [PseudonymModule, UserModule, CourseModule, ToolModule, BoardModule],
	providers: [FeathersRosterService],
	exports: [FeathersRosterService],
})
export class RosterModule {}
