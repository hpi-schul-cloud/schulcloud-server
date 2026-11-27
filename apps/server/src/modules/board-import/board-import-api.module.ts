import { ConfigurationModule } from '@infra/configuration';
import { ServerRuntimeConfigModule } from '@modules/runtime-config-api/server-runtime-config.module';
import { Module } from '@nestjs/common';
import { BOARD_IMPORT_PUBLIC_API_CONFIG_TOKEN, BoardImportPublicApiConfig } from './board-import.config';
import { BoardImportModule } from './board-import.module';
import { BoardImportController } from './controller';
import { BoardImportUc } from './uc';

@Module({
	imports: [
		BoardImportModule,
		ServerRuntimeConfigModule,
		ConfigurationModule.register(BOARD_IMPORT_PUBLIC_API_CONFIG_TOKEN, BoardImportPublicApiConfig),
	],
	controllers: [BoardImportController],
	providers: [BoardImportUc],
})
export class BoardImportApiModule {}
