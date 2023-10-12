import { Module } from '@nestjs/common';
import { GroupRepo } from './repo';
import { GroupService } from './service';

@Module({
	providers: [GroupRepo, GroupService],
	exports: [GroupService],
})
export class GroupModule {}
