import { CoreModule } from '@core/core.module';
import { Logger } from '@core/logger';
import { RabbitMQWrapperModule } from '@infra/rabbitmq';
import { S3ClientModule } from '@infra/s3-client';
import { H5PEditorModule } from '@modules/h5p-editor/h5p-editor.app.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common/config-module-options';
import { H5PLibraryManagementService, h5PLibraryManagementConfig } from './service';
import {
	H5P_CONTENT_S3_CLIENT_INJECTION_TOKEN,
	H5P_CONTENT_S3_CLIENT_CONFIG_TOKEN,
	H5PContentS3ClientConfig,
	H5P_LIBRARIES_S3_CLIENT_INJECTION_TOKEN,
	H5P_LIBRARIES_S3_CLIENT_CONFIG_TOKEN,
	H5PLibrariesS3ClientConfig,
} from '@modules/h5p-editor';

const imports = [
	ConfigModule.forRoot(createConfigModuleOptions(h5PLibraryManagementConfig)),
	CoreModule,
	H5PEditorModule,
	RabbitMQWrapperModule,
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
