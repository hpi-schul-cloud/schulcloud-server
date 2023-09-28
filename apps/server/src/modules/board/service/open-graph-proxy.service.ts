import { Injectable } from '@nestjs/common';
import { sortBy } from 'lodash';
import ogs from 'open-graph-scraper';
import { ImageObject } from 'open-graph-scraper/dist/lib/types';

export type OpenGraphData = {
	title: string;
	description: string;
	image?: OpenGraphImageData;
	url: string;
};

export type OpenGraphImageData = {
	url: string;
	type?: string;
	width?: number;
	height?: number;
};

@Injectable()
export class OpenGraphProxyService {
	async fetchOpenGraphData(url: string): Promise<OpenGraphData> {
		const data = await ogs({ url });

		const title = data.result.ogTitle ?? '';
		const description = data.result.ogDescription ?? '';
		const image = data.result.ogImage ? this.pickImage(data.result.ogImage) : undefined;

		const result = {
			title,
			description,
			image,
			url,
		};

		return result;
	}

	private pickImage(images: ImageObject[], minWidth = 400, maxWidth = 800) {
		const imagesWithCorrectDimensions = images.map((i) => this.fixDimensionTypes(i));
		const sortedImages = sortBy(imagesWithCorrectDimensions, ['width', 'height']);
		const biggestSmallEnoughImage = [...sortedImages].reverse().find((i) => i.width && i.width <= maxWidth);
		const smallestBigEnoughImage = sortedImages.find((i) => i.width && i.width >= minWidth);
		return biggestSmallEnoughImage ?? smallestBigEnoughImage ?? sortedImages[0];
	}

	private fixDimensionTypes(image: { width?: number | string; height?: number | string; url: string; type?: string }) {
		return {
			...image,
			width: image.width ? +image.width : undefined,
			height: image.height ? +image.height : undefined,
		};
	}
}
