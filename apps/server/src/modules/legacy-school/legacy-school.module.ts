import { GroupModule } from '@modules/group/group.module';
import { forwardRef, Module } from '@nestjs/common';
import { FederalStateRepo, LegacySchoolRepo } from '@shared/repo';
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
