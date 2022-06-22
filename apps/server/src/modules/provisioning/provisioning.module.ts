import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { ProvisioningService } from '@src/modules/provisioning/service/provisioning.service';
import { ProvisioningUc } from '@src/modules/provisioning/uc/provisioning.uc';

@Module({
	imports: [LoggerModule],
	controllers: [],
	providers: [ProvisioningService, ProvisioningUc],
	exports: [ProvisioningService, ProvisioningUc],
})
export class ProvisioningModule {}
