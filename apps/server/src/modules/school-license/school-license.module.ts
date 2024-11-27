import { Module } from '@nestjs/common';
import { UserLicenseModule } from '../user-license';
import { MediaSchoolLicenseRepo } from './repo/media-school-license-repo';
import { MediaSchoolLicenseService } from './service/school-license.service';

@Module({
	imports: [UserLicenseModule],
	providers: [MediaSchoolLicenseRepo, MediaSchoolLicenseService],
	exports: [MediaSchoolLicenseService],
})
export class SchoolLicenseModule {}
