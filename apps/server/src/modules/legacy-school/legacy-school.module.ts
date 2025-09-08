import { LoggerModule } from '@core/logger';
import { GroupModule } from '@modules/group';
import { SchoolModule } from '@modules/school';
import { FederalStateRepo, StorageProviderRepo } from '@modules/school/repo';
import { forwardRef, Module } from '@nestjs/common';
import { LegacySchoolRepo, SchoolSystemOptionsRepo } from './repo';
import {
	LegacySchoolService,
	ProvisioningOptionsUpdateService,
	SchoolSystemOptionsService,
	SchoolValidationService,
	SchulconnexProvisioningOptionsUpdateService,
} from './service';

/**
 * @deprecated because it uses the deprecated LegacySchoolDo.
 */
@Module({
	imports: [LoggerModule, forwardRef(() => GroupModule), SchoolModule],
	providers: [
		LegacySchoolRepo,
		LegacySchoolService,
		FederalStateRepo,
		SchoolValidationService,
		SchoolSystemOptionsRepo,
		SchoolSystemOptionsService,
		ProvisioningOptionsUpdateService,
		SchulconnexProvisioningOptionsUpdateService,
		StorageProviderRepo,
	],
	exports: [LegacySchoolService, SchoolSystemOptionsService, ProvisioningOptionsUpdateService],
})
export class LegacySchoolModule {}
