import { Injectable } from '@nestjs/common';
import { MetaTagExtractorService } from '../service';
import { MetaData } from '../types';

@Injectable()
export class MetaTagExtractorUc {
	constructor(private readonly metaTagExtractorService: MetaTagExtractorService) {}

	async getMetaData(url: string): Promise<MetaData> {
		const result = await this.metaTagExtractorService.getMetaData(url);
		return result;
	}
}
