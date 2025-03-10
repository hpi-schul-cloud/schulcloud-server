import { TeamsModule } from '@modules/team/teams.module';
import { Module } from '@nestjs/common';

@Module({
	imports: [TeamsModule],
	providers: [],
	controllers: [],
	exports: [],
})
export class TeamsApiModule {}
