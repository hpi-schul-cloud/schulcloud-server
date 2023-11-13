import { Injectable } from '@nestjs/common';
import ogs from 'open-graph-scraper';
import { ImageObject } from 'open-graph-scraper/dist/lib/types';
import { basename } from 'path';
import type { MetaData } from '../types';
import { MetaTagInternalUrlService } from './meta-tag-internal-url.service';

@Injectable()
export class MetaTagExtractorService {
	constructor(private readonly internalLinkMataTagService: MetaTagInternalUrlService) {}

	// WIP: fetch => get
	async fetchMetaData(url: string): Promise<MetaData> {
		if (url.length === 0) {
			throw new Error(`MetaTagExtractorService requires a valid URL. Given URL: ${url}`);
		}

		// WIP: make that nicer
		const metaData =
			(await this.internalLinkMataTagService.tryInternalLinkMetaTags(url)) ??
			(await this.tryExtractMetaTags(url)) ??
			this.tryFilenameAsFallback(url);

		return metaData ?? { url, title: '', description: '', type: 'unknown' };
	}

	private async tryExtractMetaTags(url: string): Promise<MetaData | undefined> {
		try {
			const data = await ogs({ url, fetchOptions: { headers: { 'User-Agent': 'Open Graph Scraper' } } });

			const title = data.result?.ogTitle ?? '';
			const description = data.result?.ogDescription ?? '';
			const image = data.result?.ogImage ? this.pickImage(data?.result?.ogImage) : undefined;

			return {
				title,
				description,
				image,
				url,
				type: 'external',
			};
		} catch (error) {
			return undefined;
		}
	}

	private tryFilenameAsFallback(url: string): MetaData | undefined {
		try {
			const urlObject = new URL(url);
			const title = basename(urlObject.pathname);
			return {
				title,
				description: '',
				url,
				type: 'unknown',
			};
		} catch (error) {
			return undefined;
		}
	}

	private pickImage(images: ImageObject[], minWidth = 400): ImageObject | undefined {
		const sortedImages = [...images];
		sortedImages.sort((a, b) => (a.width && b.width ? Number(a.width) - Number(b.width) : 0));
		const smallestBigEnoughImage = sortedImages.find((i) => i.width && i.width >= minWidth);
		const fallbackImage = images[0] && images[0].width === undefined ? images[0] : undefined;
		return smallestBigEnoughImage ?? fallbackImage;
	}
}
