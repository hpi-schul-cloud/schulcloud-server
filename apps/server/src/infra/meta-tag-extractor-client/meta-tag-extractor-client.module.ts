import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { MetaTagExtractorAdapterService } from './meta-tag-extractor-client.service';

@Module({
	imports: [HttpModule],
	providers: [MetaTagExtractorAdapterService],
	exports: [MetaTagExtractorAdapterService],
})
export class MetaTagExtractorAdapterModule {}
