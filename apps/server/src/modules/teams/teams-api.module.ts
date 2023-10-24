import { Module } from '@nestjs/common';
import { TeamsModule } from '@modules/teams/teams.module';

@Module({
	imports: [TeamsModule],
	providers: [],
	controllers: [],
	exports: [],
})
export class TeamsApiModule {}
