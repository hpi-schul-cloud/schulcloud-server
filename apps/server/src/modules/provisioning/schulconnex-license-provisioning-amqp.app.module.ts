import { CoreModule } from '@core/core.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common/config-module-options';
import { serverConfig } from '../server';
import { SchulconnexLicenseProvisioningConsumerModule } from './schulconnex-license-provisioning-consumer.module';

@Module({
	imports: [
		ConfigModule.forRoot(createConfigModuleOptions(serverConfig)),
		CoreModule,
		SchulconnexLicenseProvisioningConsumerModule,
	],
})
export class SchulconnexLicenseProvisioningAMQPModule {}
