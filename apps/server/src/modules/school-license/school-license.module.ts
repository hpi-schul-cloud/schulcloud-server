import { Module } from '@nestjs/common';
import { LoggerModule } from '@core/logger';
import { MediaSourceModule } from '../media-source/media-source.module';
import { SchoolModule } from '../school';
import { MEDIA_SCHOOL_LICENSE_REPO } from './repo';
import { MediaSchoolLicenseMikroOrmRepo } from './repo/mikro-orm/media-school-license.repo';
import { MediaSchoolLicenseService } from './service/media-school-license.service';

@Module({
	imports: [MediaSourceModule, SchoolModule, LoggerModule],
	providers: [
		MediaSchoolLicenseService,
		{ provide: MEDIA_SCHOOL_LICENSE_REPO, useClass: MediaSchoolLicenseMikroOrmRepo },
	],
	exports: [MediaSchoolLicenseService],
})
export class SchoolLicenseModule {}
