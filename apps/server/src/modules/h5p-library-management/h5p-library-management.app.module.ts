import { CoreModule } from '@core/core.module';
import { Logger } from '@core/logger';
import { S3ClientModule } from '@infra/s3-client';
import {
	H5P_CONTENT_S3_CLIENT_CONFIG_TOKEN,
	H5P_CONTENT_S3_CLIENT_INJECTION_TOKEN,
	H5P_LIBRARIES_S3_CLIENT_CONFIG_TOKEN,
	H5P_LIBRARIES_S3_CLIENT_INJECTION_TOKEN,
	H5PContentS3ClientConfig,
	H5PLibrariesS3ClientConfig,
} from '@modules/h5p-editor';
import { H5PEditorModule } from '@modules/h5p-editor/h5p-editor.app.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common/config-module-options';
import { h5PLibraryManagementConfig, H5PLibraryManagementService } from './service';

const imports = [
	ConfigModule.forRoot(createConfigModuleOptions(h5PLibraryManagementConfig)),
	CoreModule,
	H5PEditorModule,
	S3ClientModule.register({
		clientInjectionToken: H5P_CONTENT_S3_CLIENT_INJECTION_TOKEN,
		configInjectionToken: H5P_CONTENT_S3_CLIENT_CONFIG_TOKEN,
		configConstructor: H5PContentS3ClientConfig,
	}),
	S3ClientModule.register({
		clientInjectionToken: H5P_LIBRARIES_S3_CLIENT_INJECTION_TOKEN,
		configInjectionToken: H5P_LIBRARIES_S3_CLIENT_CONFIG_TOKEN,
		configConstructor: H5PLibrariesS3ClientConfig,
	}),
];

const controllers = [];

const providers = [Logger, H5PLibraryManagementService];

@Module({
	imports,
	controllers,
	providers,
	exports: [],
})
export class H5PLibraryManagementModule {}
