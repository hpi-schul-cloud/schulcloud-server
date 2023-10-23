import { Injectable } from '@nestjs/common';
import ogs from 'open-graph-scraper';
import { ImageObject } from 'open-graph-scraper/dist/lib/types';

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
			// WIP: add nice debug logging for available open GraphData?!?
			return {
				title: '',
				description: '',
				url,
			};
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
