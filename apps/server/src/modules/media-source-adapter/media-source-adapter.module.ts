import { Module } from '@nestjs/common';
import { MediaSourceSyncModule } from '@modules/media-source-sync';
import { MediaSourceAdapterService } from './service';

@Module({
	imports: [MediaSourceSyncModule],
	providers: [MediaSourceAdapterService],
	exports: [MediaSourceAdapterService],
})
export class MediaSourceAdapterModule {}
