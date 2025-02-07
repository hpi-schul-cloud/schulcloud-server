import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EncryptionModule } from '@infra/encryption';
import { OauthAdapterModule } from '@modules/oauth-adapter';
import { ExternalToolModule } from '@modules/tool';
import { BiloMediaFetchService, MediaSourceSyncService } from './service';
import { BiloSyncStrategy } from './service/strategy';

@Module({
	imports: [HttpModule, OauthAdapterModule, EncryptionModule, ExternalToolModule],
	providers: [MediaSourceSyncService, BiloMediaFetchService, BiloSyncStrategy],
	exports: [MediaSourceSyncService],
})
export class MediaSourceSyncModule {}
