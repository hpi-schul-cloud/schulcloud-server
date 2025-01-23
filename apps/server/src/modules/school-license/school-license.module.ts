import { EncryptionModule } from '@infra/encryption';
import { VidisClientModule } from '@infra/vidis-client';
import { Module } from '@nestjs/common';
import { LoggerModule } from '@core/logger';
import { AuthorizationModule } from '../authorization';
import { MediaSourceModule } from '../media-source/media-source.module';
import { SchoolModule } from '../school';
import { SchoolLicenseController } from './api/school-license.controller';
import { MEDIA_SCHOOL_LICENSE_REPO } from './repo';
import { MediaSchoolLicenseMikroOrmRepo } from './repo/mikro-orm/media-school-license.repo';
import { MediaSchoolLicenseService } from './service';
import { MediaSchoolLicenseFetchService } from './service/media-school-license-fetch.service';
import { MediaSchoolLicenseUc } from './uc';

@Module({
	imports: [MediaSourceModule, SchoolModule, LoggerModule, VidisClientModule, EncryptionModule, AuthorizationModule],
	controllers: [SchoolLicenseController],
	providers: [
		MediaSchoolLicenseService,
		{ provide: MEDIA_SCHOOL_LICENSE_REPO, useClass: MediaSchoolLicenseMikroOrmRepo },
		MediaSchoolLicenseUc,
		MediaSchoolLicenseFetchService,
	],
	exports: [MediaSchoolLicenseService],
})
export class SchoolLicenseModule {}
