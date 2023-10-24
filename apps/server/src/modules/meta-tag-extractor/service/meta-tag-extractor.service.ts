import { Injectable } from '@nestjs/common';
import ogs from 'open-graph-scraper';
import { ImageObject } from 'open-graph-scraper/dist/lib/types';
import { basename } from 'path';

export type MetaData = {
	title: string;
	description: string;
	url: string;
	image?: ImageObject;
};

@Injectable()
export class MetaTagExtractorService {
	async fetchMetaData(url: string): Promise<MetaData> {
		if (url.length === 0) {
			// WIP: add nice debug logging for available open GraphData?!?
			throw new Error(`MetaTagExtractorService requires a valid URL. Given URL: ${url}`);
		}

		const metaData = (await this.tryExtractMetaTags(url)) ?? this.tryFilenameAsFallback(url);

		return metaData ?? { url, title: '', description: '' };
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
