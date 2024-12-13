import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logger';
import { MediaSourceModule } from '../media-source/media-source.module';
import { SchoolModule } from '../school';
import { MediaSchoolLicenseRepo } from './repo/media-school-license-repo';
import { MediaSchoolLicenseService } from './service/media-school-license.service';

@Module({
	imports: [MediaSourceModule, SchoolModule, LoggerModule],
	providers: [MediaSchoolLicenseRepo, MediaSchoolLicenseService],
	exports: [MediaSchoolLicenseService],
})
export class SchoolLicenseModule {}
