import { CoreModule } from '@core/core.module';
import { PreviewGeneratorConsumerModule } from '@infra/preview-generator';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common/config-module-options';
import { config, defaultConfig, s3Config } from './files-storage.config';

@Module({
	imports: [
		ConfigModule.forRoot(createConfigModuleOptions(config)),
		PreviewGeneratorConsumerModule.register({ storageConfig: s3Config, serverConfig: defaultConfig }),
		CoreModule,
	],
})
export class PreviewGeneratorAMQPModule {}
