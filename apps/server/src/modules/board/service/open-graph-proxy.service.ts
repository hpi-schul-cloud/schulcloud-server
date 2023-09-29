import { Injectable } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { sortBy } from 'lodash';
import ogs from 'open-graph-scraper';
import { ImageObject } from 'open-graph-scraper/dist/lib/types';

export class OpenGraphImageData {
	constructor({ url, type, width, height }: OpenGraphImageData) {
		this.url = url;
		this.type = type;
		this.width = width ? +width : undefined;
		this.height = height ? +height : undefined;
	}

	@ApiProperty()
	url: string;

	@ApiPropertyOptional()
	type?: string;

	@ApiPropertyOptional()
	width?: number;

	@ApiPropertyOptional()
	height?: number;
}

export class OpenGraphData {
	constructor({ title, description, image, url }: OpenGraphData) {
		this.title = title;
		this.description = description;
		this.image = image;
		this.url = url;
	}

	@ApiProperty()
	title: string;

	@ApiProperty()
	description: string;

	@ApiPropertyOptional()
	image?: OpenGraphImageData;

	@ApiProperty()
	url: string;
}

@Injectable()
export class OpenGraphProxyService {
	async fetchOpenGraphData(url: string): Promise<OpenGraphData> {
		const data = await ogs({ url });

		const title = data.result.ogTitle ?? '';
		const description = data.result.ogDescription ?? '';
		const image = data.result.ogImage ? this.pickImage(data.result.ogImage) : undefined;

		const result = new OpenGraphData({
			title,
			description,
			image,
			url,
		});

		return result;
	}

	private pickImage(images: ImageObject[], minWidth = 400, maxWidth = 800): OpenGraphImageData {
		const imagesWithCorrectDimensions = images.map((i) => new OpenGraphImageData(i));
		const sortedImages = sortBy(imagesWithCorrectDimensions, ['width', 'height']);
		const biggestSmallEnoughImage = [...sortedImages].reverse().find((i) => i.width && i.width <= maxWidth);
		const smallestBigEnoughImage = sortedImages.find((i) => i.width && i.width >= minWidth);
		// return imagesWithCorrectDimensions[0];
		return biggestSmallEnoughImage ?? smallestBigEnoughImage ?? sortedImages[0];
	}
}
