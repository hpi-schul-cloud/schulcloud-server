import { ConfigurationModule } from '@infra/configuration';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ReleasesService } from './domain';
import { RELEASES_CONFIG_TOKEN, ReleasesConfig } from './releases.config';
import { ReleaseImagesRepo, ReleasesRepo } from './repo';

@Module({
	imports: [HttpModule, ConfigurationModule.register(RELEASES_CONFIG_TOKEN, ReleasesConfig)],
	providers: [ReleasesService, ReleasesRepo, ReleaseImagesRepo],
	exports: [ReleasesService],
})
export class ReleasesModule {}
