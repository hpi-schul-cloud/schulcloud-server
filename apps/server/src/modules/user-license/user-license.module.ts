import { Module } from '@nestjs/common';
import { MediaSourceRepo, MediaUserLicenseRepo } from './repo';
import { MediaSourceService, MediaUserLicenseService } from './service';

@Module({
	providers: [MediaUserLicenseRepo, MediaUserLicenseService, MediaSourceRepo, MediaSourceService],
	exports: [MediaUserLicenseService, MediaSourceService, MediaSourceRepo],
})
export class UserLicenseModule {}
