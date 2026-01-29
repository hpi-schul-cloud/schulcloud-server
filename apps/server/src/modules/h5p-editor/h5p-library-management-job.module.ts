import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { Module } from '@nestjs/common';
import { H5PLibraryManagementService } from './service';
import { H5P_EDITOR_CONFIG_TOKEN, H5PEditorConfig } from './h5p-editor.config';
import { H5PEditorModule } from './h5p-editor.module';

@Module({
	imports: [ConfigurationModule.register(H5P_EDITOR_CONFIG_TOKEN, H5PEditorConfig), LoggerModule, H5PEditorModule],
	controllers: [],
	providers: [H5PLibraryManagementService],
	exports: [H5PLibraryManagementService],
})
export class H5pLibraryManagementJobModule {}
