import { Module } from '@nestjs/common';
import { MediaSourceRepo, UserLicenseRepo } from './repo';
import { MediaSourceService, MediaUserLicenseService, UserLicenseService } from './service';

@Module({
	providers: [UserLicenseRepo, UserLicenseService, MediaUserLicenseService, MediaSourceRepo, MediaSourceService],
	exports: [UserLicenseService, MediaUserLicenseService, MediaSourceService],
})
export class UserLicenseModule {}
