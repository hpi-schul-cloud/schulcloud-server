import { Module } from '@nestjs/common';
import { MediaSourceModule } from '../mediasource/media-source.module';
import { MediaSchoolLicenseRepo } from './repo/media-school-license-repo';
import { MediaSchoolLicenseService } from './service/school-license.service';

@Module({
	imports: [MediaSourceModule],
	providers: [MediaSchoolLicenseRepo, MediaSchoolLicenseService],
	exports: [MediaSchoolLicenseService],
})
export class SchoolLicenseModule {}
