import { Module } from '@nestjs/common';
import { TeamsModule } from './teams.module';

@Module({
	imports: [TeamsModule],
	providers: [],
	controllers: [],
	exports: [],
})
export class TeamsApiModule {}
