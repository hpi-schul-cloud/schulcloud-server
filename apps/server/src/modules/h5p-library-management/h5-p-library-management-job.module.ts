import { CoreModule } from '@core/core.module';
import { Logger } from '@core/logger';
import { S3ClientModule } from '@infra/s3-client';
import { s3ConfigContent, s3ConfigLibraries } from '@modules/h5p-editor';
import { H5PEditorJobModule } from '@modules/h5p-editor/h5-p-editor-job.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common/config-module-options';
import { H5PLibraryManagementService, h5PLibraryManagementConfig } from './service';

const imports = [
	ConfigModule.forRoot(createConfigModuleOptions(h5PLibraryManagementConfig)),
	CoreModule,
	H5PEditorJobModule,
	S3ClientModule.register([s3ConfigContent, s3ConfigLibraries]),
];

const controllers = [];

const providers = [Logger, H5PLibraryManagementService];

@Module({
	imports,
	controllers,
	providers,
	exports: [],
})
export class H5PLibraryManagementJobModule {}
