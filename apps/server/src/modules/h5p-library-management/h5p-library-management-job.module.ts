import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { H5P_EDITOR_CONFIG_TOKEN, H5PEditorConfig, H5PEditorModule } from '@modules/h5p-editor';
import { Module } from '@nestjs/common';
import { H5PLibraryManagementService } from './service';

@Module({
	imports: [ConfigurationModule.register(H5P_EDITOR_CONFIG_TOKEN, H5PEditorConfig), LoggerModule, H5PEditorModule],
	controllers: [],
	providers: [H5PLibraryManagementService],
	exports: [H5PLibraryManagementService],
})
export class H5pLibraryManagementJobModule {}
