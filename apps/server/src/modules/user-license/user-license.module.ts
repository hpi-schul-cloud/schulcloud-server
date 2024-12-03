import { Module } from '@nestjs/common';
import { MediaSourceService } from '@src/modules/mediasource/service';
import { MediaSourceRepo } from '@src/modules/mediasource/repo';
import { MediasourceModule } from '../mediasource/mediasource.module';
import { MediaUserLicenseRepo } from './repo';
import { MediaUserLicenseService } from './service';

@Module({
	imports: [MediasourceModule],
	providers: [MediaUserLicenseRepo, MediaUserLicenseService, MediaSourceRepo, MediaSourceService],
	exports: [MediaUserLicenseService, MediaSourceService, MediaSourceRepo],
})
export class UserLicenseModule {}
