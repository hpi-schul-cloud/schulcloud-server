import { Injectable } from '@nestjs/common';
import { basename } from 'path';
import type { MetaData } from '../types';
import { MetaTagInternalUrlService } from './meta-tag-internal-url.service';
import { MetaTagExternalUrlService } from './meta-tag-external-url.service';

@Injectable()
export class MetaTagExtractorService {
	constructor(
		private readonly internalLinkMataTagService: MetaTagInternalUrlService,
		private readonly externalLinkMetaTagService: MetaTagExternalUrlService
	) {}

	async getMetaData(url: string): Promise<MetaData> {
		if (url.length === 0) {
			throw new Error(`MetaTagExtractorService requires a valid URL. Given URL: ${url}`);
		}
		const urlObject = new URL(url);
		if (urlObject.protocol !== 'https:') {
			throw new Error(`MetaTagExtractorService requires https-protocol. Given URL: ${url}`);
		}

		const metaData =
			(await this.tryInternalLinkMetaTags(url)) ??
			(await this.tryExtractMetaTagsFromExternalUrl(url)) ??
			this.useFilenameAsFallback(url);

		return metaData;
	}

	private async tryInternalLinkMetaTags(url: string): Promise<MetaData | undefined> {
		return this.internalLinkMataTagService.tryInternalLinkMetaTags(url);
	}

	private async tryExtractMetaTagsFromExternalUrl(url: string): Promise<MetaData | undefined> {
		return this.externalLinkMetaTagService.tryExtractMetaTags(url);
	}

	private useFilenameAsFallback(url: string): MetaData {
		const metaData: MetaData = { url, title: '', description: '', type: 'unknown' };
		try {
			const urlObject = new URL(url);
			return {
				title: basename(urlObject.pathname),
				description: '',
				url,
				type: 'unknown',
			};
		} catch (error) {
			console.log('error', error); // TODO: log error
		}
		return metaData;
	}
}
