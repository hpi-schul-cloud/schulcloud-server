import { Module } from '@nestjs/common';
import { EncryptionModule } from '@infra/encryption';
import { OauthAdapterModule } from '@modules/oauth-adapter';
import { HttpModule } from '@nestjs/axios';
import { ExternalToolModule } from '@modules/tool/external-tool';
import { BiloMediaFetchService, MediaSourceService, MediaSourceSyncService } from './service';
import { BiloSyncStrategy } from './service/sync-strategy';
import { MediaSourceRepo } from './repo';

@Module({
	imports: [HttpModule, OauthAdapterModule, EncryptionModule, ExternalToolModule],
	providers: [MediaSourceService, MediaSourceSyncService, MediaSourceRepo, BiloMediaFetchService, BiloSyncStrategy],
	exports: [MediaSourceService, MediaSourceSyncService, MediaSourceRepo],
})
export class MediaSourceModule {}
