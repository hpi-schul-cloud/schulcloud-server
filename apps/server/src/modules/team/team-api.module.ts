import { TeamModule } from '@modules/team/team.module';
import { Module } from '@nestjs/common';
import { DeletionModule } from '@modules/deletion';

@Module({
	imports: [TeamModule, DeletionModule],
	providers: [],
	controllers: [],
	exports: [],
})
export class TeamApiModule {}
