import { TeamModule } from '@modules/team/team.module';
import { Module } from '@nestjs/common';

@Module({
	imports: [TeamModule],
	providers: [],
	controllers: [],
	exports: [],
})
export class TeamApiModule {}
