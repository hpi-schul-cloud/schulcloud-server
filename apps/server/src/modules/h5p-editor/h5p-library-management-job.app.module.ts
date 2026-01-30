import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { DATABASE_CONFIG_TOKEN, DatabaseConfig, DatabaseModule } from '@infra/database';
import { Module } from '@nestjs/common';
import { H5P_EDITOR_CONFIG_TOKEN, H5PEditorConfig } from './h5p-editor.config';
import { ENTITIES } from './h5p-editor.entity.exports';
import { H5PEditorModule } from './h5p-editor.module';
import { H5PLibraryManagementService } from './service';

@Module({
	imports: [
		ConfigurationModule.register(H5P_EDITOR_CONFIG_TOKEN, H5PEditorConfig),
		LoggerModule,
		H5PEditorModule,
		DatabaseModule.register({
			configInjectionToken: DATABASE_CONFIG_TOKEN,
			configConstructor: DatabaseConfig,
			entities: ENTITIES,
		}),
	],
	providers: [H5PLibraryManagementService],
	exports: [H5PLibraryManagementService],
})
export class H5PLibraryManagementJobModule {}
