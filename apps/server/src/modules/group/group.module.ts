import { LearnroomModule } from '@modules/learnroom/learnroom.module';
import { Module } from '@nestjs/common';
import { GroupRepo } from './repo';
import { GroupService } from './service';

@Module({
	imports: [LearnroomModule],
	providers: [GroupRepo, GroupService],
	exports: [GroupService],
})
export class GroupModule {}
