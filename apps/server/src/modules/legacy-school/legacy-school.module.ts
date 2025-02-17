import { LoggerModule } from '@core/logger';
import { GroupModule } from '@modules/group';
import { SchoolModule } from '@modules/school';
import { FederalStateRepo } from '@modules/school/repo';
import { forwardRef, Module } from '@nestjs/common';
import { LegacySchoolRepo } from '@shared/repo/school';
import { StorageProviderRepo } from '@shared/repo/storageprovider';
import { SchoolSystemOptionsRepo } from './repo';
import {
	FederalStateService,
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
		FederalStateService,
		FederalStateRepo,
		SchoolValidationService,
		SchoolSystemOptionsRepo,
		SchoolSystemOptionsService,
		ProvisioningOptionsUpdateService,
		SchulconnexProvisioningOptionsUpdateService,
		StorageProviderRepo,
	],
	exports: [LegacySchoolService, FederalStateService, SchoolSystemOptionsService, ProvisioningOptionsUpdateService],
})
export class LegacySchoolModule {}
