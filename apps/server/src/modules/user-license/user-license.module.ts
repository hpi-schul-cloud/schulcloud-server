import { Module } from '@nestjs/common';
import { UserLicenseRepo } from './repo';
import { UserLicenseService } from './service';

@Module({
	providers: [UserLicenseRepo, UserLicenseService],
	exports: [UserLicenseService],
})
export class UserLicenseModule {}
