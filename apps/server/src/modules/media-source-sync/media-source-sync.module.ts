import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BiloClientModule } from '@infra/bilo-client';
import { EncryptionModule } from '@infra/encryption';
import { OauthAdapterModule } from '@modules/oauth-adapter';
import { ExternalToolModule } from '@modules/tool';
import { MediaSourceSyncService } from './service';
import { BiloSyncStrategy } from './service/strategy';

@Module({
	imports: [HttpModule, OauthAdapterModule, EncryptionModule, ExternalToolModule, BiloClientModule],
	providers: [MediaSourceSyncService, BiloSyncStrategy],
	exports: [MediaSourceSyncService],
})
export class MediaSourceSyncModule {}
