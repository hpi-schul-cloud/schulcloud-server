import { LoggerModule } from '@core/logger';
import { EncryptionModule } from '@infra/encryption';
import { MediaSourceModule } from '@modules/media-source/media-source.module';
import { SchoolModule } from '@modules/school';
import { Module } from '@nestjs/common';
import { MEDIA_SCHOOL_LICENSE_REPO } from './repo';
import { MediaSchoolLicenseMikroOrmRepo } from './repo/mikro-orm/media-school-license.repo';
import { MediaSchoolLicenseFetchService, MediaSchoolLicenseService } from './service';

@Module({
	imports: [MediaSourceModule, SchoolModule, LoggerModule, EncryptionModule],
	providers: [
		{ provide: MEDIA_SCHOOL_LICENSE_REPO, useClass: MediaSchoolLicenseMikroOrmRepo },
		MediaSchoolLicenseService,
		MediaSchoolLicenseFetchService,
	],
	exports: [MediaSchoolLicenseService],
})
export class SchoolLicenseModule {}
