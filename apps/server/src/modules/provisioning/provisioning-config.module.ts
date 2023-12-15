import { Module } from '@nestjs/common';
import { ProvisioningConfiguration, ProvisioningFeatures } from './config';

@Module({
	providers: [
		{
			provide: ProvisioningFeatures,
			useValue: ProvisioningConfiguration.provisioningFeatures,
		},
	],
	exports: [ProvisioningFeatures],
})
export class ProvisioningConfigModule {}
