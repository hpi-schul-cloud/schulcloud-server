import { Module } from '@nestjs/common';
import { GroupRepo } from './repo/group.repo';
import { GroupService } from './service/group.service';

@Module({
	providers: [GroupRepo, GroupService],
	exports: [GroupService],
})
export class GroupModule {}
