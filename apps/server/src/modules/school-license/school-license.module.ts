import { Module } from '@nestjs/common';
import { MediasourceModule } from '../mediasource/mediasource.module';
import { MediaSchoolLicenseRepo } from './repo/media-school-license-repo';
import { MediaSchoolLicenseService } from './service/school-license.service';

@Module({
	imports: [MediasourceModule],
	providers: [MediaSchoolLicenseRepo, MediaSchoolLicenseService],
	exports: [MediaSchoolLicenseService],
})
export class SchoolLicenseModule {}
