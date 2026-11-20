import { CoreModule } from '@core/core.module';
import { Module } from '@nestjs/common';
import { BoardImportApiModule } from './board-import-api.module';

@Module({
	imports: [CoreModule, BoardImportApiModule],
})
export class BoardImportApiAppModule {}
