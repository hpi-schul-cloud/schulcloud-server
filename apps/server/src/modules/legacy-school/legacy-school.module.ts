import { GroupModule } from '@modules/group';
import { forwardRef, Module } from '@nestjs/common';
import { FederalStateRepo } from '@shared/repo/federalstate';
import { LegacySchoolRepo } from '@shared/repo/school';
import { StorageProviderRepo } from '@shared/repo/storageprovider';
import { LoggerModule } from '@src/core/logger';
import { SchoolSystemOptionsRepo, SchoolYearRepo } from './repo';
import {
	FederalStateService,
	LegacySchoolService,
	ProvisioningOptionsUpdateService,
	SchoolSystemOptionsService,
	SchoolValidationService,
	SchoolYearService,
	SchulconnexProvisioningOptionsUpdateService,
} from './service';

/**
 * @deprecated because it uses the deprecated LegacySchoolDo.
 */
@Module({
	imports: [LoggerModule, forwardRef(() => GroupModule)],
	providers: [
		LegacySchoolRepo,
		LegacySchoolService,
		SchoolYearService,
		SchoolYearRepo,
		FederalStateService,
		FederalStateRepo,
		SchoolValidationService,
		SchoolSystemOptionsRepo,
		SchoolSystemOptionsService,
		ProvisioningOptionsUpdateService,
		SchulconnexProvisioningOptionsUpdateService,
		StorageProviderRepo,
	],
	exports: [
		LegacySchoolService,
		SchoolYearService,
		FederalStateService,
		SchoolSystemOptionsService,
		ProvisioningOptionsUpdateService,
	],
})
export class LegacySchoolModule {}
