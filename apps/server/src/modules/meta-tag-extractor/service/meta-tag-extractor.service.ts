import { Injectable } from '@nestjs/common';
import net from 'net';
import { basename } from 'path';
import { InvalidLinkUrlLoggableException } from '../loggable/invalid-link-url.loggable';
import type { MetaData } from '../types';
import { MetaTagExternalUrlService } from './meta-tag-external-url.service';
import { MetaTagInternalUrlService } from './meta-tag-internal-url.service';

@Injectable()
export class MetaTagExtractorService {
	constructor(
		private readonly internalLinkMataTagService: MetaTagInternalUrlService,
		private readonly externalLinkMetaTagService: MetaTagExternalUrlService
	) {}

	async getMetaData(urlString: string): Promise<MetaData> {
		const url = this.parseValidUrl(urlString);

		const metaData =
			(await this.tryInternalLinkMetaTags(url)) ??
			(await this.tryExtractMetaTagsFromExternalUrl(url)) ??
			this.useFilenameAsFallback(url);

		return metaData;
	}

	parseValidUrl(url: string): URL {
		if (url.length === 0) {
			throw new InvalidLinkUrlLoggableException(url, 'Empty url given');
		}

		let urlObject: URL;
		try {
			urlObject = new URL(url);
		} catch (err) {
			throw new InvalidLinkUrlLoggableException(url, 'Invalid URL');
		}

		// enforce https
		urlObject.protocol = 'https:';

		if (net.isIPv4(urlObject.hostname) || net.isIPv6(urlObject.hostname)) {
			throw new InvalidLinkUrlLoggableException(url, 'IP adress is not allowed as hostname');
		}
		return urlObject;
	}

	private async tryInternalLinkMetaTags(url: URL): Promise<MetaData | undefined> {
		return this.internalLinkMataTagService.tryInternalLinkMetaTags(url);
	}

	private async tryExtractMetaTagsFromExternalUrl(url: URL): Promise<MetaData | undefined> {
		return this.externalLinkMetaTagService.tryExtractMetaTags(url);
	}

	private useFilenameAsFallback(url: URL): MetaData {
		return {
			title: basename(url.pathname),
			description: '',
			url: url.toString(),
			type: 'unknown',
		};
	}
}
