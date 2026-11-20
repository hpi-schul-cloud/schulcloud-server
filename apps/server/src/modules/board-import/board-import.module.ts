import { Module } from '@nestjs/common';
import { BOARD_IMPORT_JOB_REPO, BoardImportJobService } from './domain';
import { BoardImportJobMikroOrmRepo } from './repo/mikro-orm';

@Module({
	providers: [
		{
			provide: BOARD_IMPORT_JOB_REPO,
			useClass: BoardImportJobMikroOrmRepo,
		},
		BoardImportJobService,
	],
	exports: [BoardImportJobService],
})
export class BoardImportModule {}
