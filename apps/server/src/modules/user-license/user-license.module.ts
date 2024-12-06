import { Module } from '@nestjs/common';
import { MediasourceModule } from '../mediasource/mediasource.module';
import { MediaUserLicenseRepo } from './repo';
import { MediaUserLicenseService } from './service';

@Module({
	imports: [MediasourceModule],
	providers: [MediaUserLicenseRepo, MediaUserLicenseService],
	exports: [MediaUserLicenseService],
})
export class UserLicenseModule {}
