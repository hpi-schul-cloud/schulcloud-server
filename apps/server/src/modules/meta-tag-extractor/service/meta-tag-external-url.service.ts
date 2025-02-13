import { Injectable } from '@nestjs/common';
import axios from 'axios';
import ogs from 'open-graph-scraper';
import { ImageObject } from 'open-graph-scraper/types/lib/types';
import { InvalidLinkUrlLoggableException } from '../loggable/invalid-link-url.loggable';
import { MetaData, MetaDataEntityType } from '../types';

@Injectable()
export class MetaTagExternalUrlService {
	public async tryExtractMetaTags(url: URL): Promise<MetaData | undefined> {
		try {
			const html = await this.fetchHtmlPartly(url);
			const result = await this.parseHtml(html);
			if (!result) {
				return undefined;
			}

			const { ogTitle, ogDescription, ogImage } = result;

			return {
				title: ogTitle ?? '',
				description: ogDescription ?? '',
				originalImageUrl: this.getImageUrl(ogImage, url),
				url: url.toString(),
				type: MetaDataEntityType.EXTERNAL,
			};
		} catch {
			return undefined;
		}
	}

	private async parseHtml(html: string) {
		try {
			const { result } = await ogs({ html });
			return { ogImage: [], ...result };
		} catch (error) {
			// unable to parse html
			return undefined;
		}
	}

	private async fetchHtmlPartly(url: URL, maxLength = 50000): Promise<string> {
		const source = axios.CancelToken.source();
		let html = '';

		try {
			const response = await axios.get(url.toString(), {
				headers: { 'User-Agent': 'Open Graph Scraper' },
				responseType: 'stream',
				cancelToken: source.token,
			});

			const stream = response.data as NodeJS.ReadableStream;
			stream.on('data', (chunk: Buffer) => {
				html += chunk.toString('utf-8');
				if (html.length >= maxLength) {
					source.cancel(`Request canceled after receiving ${maxLength} characters.`);
				}
			});

			await new Promise((resolve, reject) => {
				stream.on('end', resolve);
				stream.on('error', reject);
			});
		} catch (error) {
			// mocking the internal axios cancelation mechanism (including throwing this cancelation error) was not possible... so:
			// istanbul ignore next
			if (!axios.isCancel(error)) {
				throw new InvalidLinkUrlLoggableException(url.toString(), 'Unable to fetch html for meta tag extraction');
			}
		}
		return html.slice(0, maxLength);
	}

	private getImageUrl(images: ImageObject[], url: URL): string | undefined {
		const image = this.pickImage(images);
		if (!image) {
			return undefined;
		}

		const baseUrl = new URL(url.toString());
		baseUrl.pathname = '';

		const imageUrl = new URL(image.url, baseUrl.toString());
		return imageUrl.toString();
	}

	private pickImage(images: ImageObject[], minWidth = 400): ImageObject | undefined {
		const sortedImages = [...images];
		sortedImages.sort((a, b) => (a.width && b.width ? Number(a.width) - Number(b.width) : 0));
		const smallestBigEnoughImage = sortedImages.find((i) => i.width && i.width >= minWidth);
		const fallbackImage = images[0] && images[0].width === undefined ? images[0] : undefined;
		return smallestBigEnoughImage ?? fallbackImage;
	}
}
