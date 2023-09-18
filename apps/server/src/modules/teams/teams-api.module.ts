import { Module } from '@nestjs/common';
import { TeamsModule } from '@src/modules/teams/teams.module';

@Module({
	imports: [TeamsModule],
	providers: [],
	controllers: [],
	exports: [],
})
export class TeamsApiModule {}
