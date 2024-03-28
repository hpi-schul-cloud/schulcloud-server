import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { GroupRepo } from './repo';
import { GroupService } from './service';

@Module({
	imports: [CqrsModule],
	providers: [GroupRepo, GroupService],
	exports: [GroupService],
})
export class GroupModule {}
