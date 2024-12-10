import { Module } from '@nestjs/common';
import { MediaSourceModule } from '../mediasource/media-source.module';
import { MediaUserLicenseRepo } from './repo';
import { MediaUserLicenseService } from './service';

@Module({
	imports: [MediaSourceModule],
	providers: [MediaUserLicenseRepo, MediaUserLicenseService],
	exports: [MediaUserLicenseService],
})
export class UserLicenseModule {}
