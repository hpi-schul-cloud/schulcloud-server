import { ConfigurationModule } from '@infra/configuration';
import { Module } from '@nestjs/common';
import { BOARD_IMPORT_PUBLIC_API_CONFIG_TOKEN, BoardImportPublicApiConfig } from './board-import.config';
import { BoardImportModule } from './board-import.module';
import { BoardImportController } from './controller';
import { BoardImportUc } from './uc';

@Module({
	imports: [
		BoardImportModule,
		ConfigurationModule.register(BOARD_IMPORT_PUBLIC_API_CONFIG_TOKEN, BoardImportPublicApiConfig),
	],
	controllers: [BoardImportController],
	providers: [BoardImportUc],
})
export class BoardImportApiModule {}
