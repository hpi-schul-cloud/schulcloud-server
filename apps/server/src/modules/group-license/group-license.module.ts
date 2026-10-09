import { Module } from '@nestjs/common';
import { MEDIA_GROUP_LICENSE_REPO, MediaGroupLicenseMikroOrmRepo } from './repo';
import { MediaGroupLicenseService } from './service';

@Module({
	providers: [
		{
			provide: MEDIA_GROUP_LICENSE_REPO,
			useClass: MediaGroupLicenseMikroOrmRepo,
		},
		MediaGroupLicenseService,
	],
	exports: [MediaGroupLicenseService],
})
export class GroupLicenseModule {}
