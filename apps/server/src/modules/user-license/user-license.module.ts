import { Module } from '@nestjs/common';
import { UserLicenseRepo } from './repo';
import { MediaUserLicenseService, UserLicenseService } from './service';

@Module({
	providers: [UserLicenseRepo, UserLicenseService, MediaUserLicenseService],
	exports: [UserLicenseService, MediaUserLicenseService],
})
export class UserLicenseModule {}
