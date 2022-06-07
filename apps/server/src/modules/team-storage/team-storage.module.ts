import { Module } from '@nestjs/common';
import { TeamStorageController } from './controller/team-storage.controller';
import { TeamStorageUc } from './uc/team-storage.uc';

@Module({
	imports: [],
	providers: [TeamStorageUc],
	controllers: [TeamStorageController],
	exports: [TeamStorageUc],
})
export class TeamStorageModule {}
