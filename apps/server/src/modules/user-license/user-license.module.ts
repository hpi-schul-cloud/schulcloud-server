import { Module } from '@nestjs/common';
import { MediaSourceRepo, MediaUserLicenseRepo } from './repo';
import { MediaSourceService, MediaUserLicenseService, UserLicenseService } from './service';

@Module({
	providers: [MediaUserLicenseRepo, UserLicenseService, MediaUserLicenseService, MediaSourceRepo, MediaSourceService],
	exports: [UserLicenseService, MediaUserLicenseService, MediaSourceService],
})
export class UserLicenseModule {}
