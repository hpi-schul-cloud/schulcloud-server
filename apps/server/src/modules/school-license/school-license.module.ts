import { LoggerModule } from '@core/logger';
import { VidisClientModule } from '@infra/vidis-client';
import { MediaSourceModule } from '@modules/media-source/media-source.module';
import { SchoolModule } from '@modules/school';
import { Module } from '@nestjs/common';
import { MEDIA_SCHOOL_LICENSE_REPO } from './repo';
import { MediaSchoolLicenseMikroOrmRepo } from './repo/mikro-orm/media-school-license.repo';
import { MediaSchoolLicenseService } from './service';

@Module({
	imports: [MediaSourceModule, SchoolModule, LoggerModule, VidisClientModule],
	providers: [
		{ provide: MEDIA_SCHOOL_LICENSE_REPO, useClass: MediaSchoolLicenseMikroOrmRepo },
		MediaSchoolLicenseService,
	],
	exports: [MediaSchoolLicenseService],
})
export class SchoolLicenseModule {}
