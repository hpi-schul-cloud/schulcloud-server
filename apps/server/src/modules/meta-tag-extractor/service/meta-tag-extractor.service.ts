import { Injectable } from '@nestjs/common';
import axios from 'axios';
import ogs from 'open-graph-scraper';
import { ImageObject } from 'open-graph-scraper/dist/lib/types';
import { basename } from 'path';
import type { MetaData } from '../types';
import { MetaTagInternalUrlService } from './meta-tag-internal-url.service';

@Injectable()
export class MetaTagExtractorService {
	constructor(private readonly internalLinkMataTagService: MetaTagInternalUrlService) {}

	async getMetaData(url: string): Promise<MetaData> {
		if (url.length === 0) {
			throw new Error(`MetaTagExtractorService requires a valid URL. Given URL: ${url}`);
		}

		const metaData =
			(await this.tryInternalLinkMetaTags(url)) ??
			(await this.tryExtractMetaTags(url)) ??
			this.tryFilenameAsFallback(url) ??
			this.getDefaultMetaData(url);

		return metaData;
	}

	private async tryInternalLinkMetaTags(url: string): Promise<MetaData | undefined> {
		return this.internalLinkMataTagService.tryInternalLinkMetaTags(url);
	}

	private async tryExtractMetaTags(url: string): Promise<MetaData | undefined> {
		try {
			const html = await this.fetchHtmlPartly(url);
			const { result } = await ogs({ html });
			const { ogTitle, ogDescription, ogImage } = result;

			return {
				title: ogTitle ?? '',
				description: ogDescription ?? '',
				image: ogImage ? this.pickImage(ogImage) : undefined,
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
			return {
				title: basename(urlObject.pathname),
				description: '',
				url,
				type: 'unknown',
			};
		} catch (error) {
			return undefined;
		}
	}

	private getDefaultMetaData(url: string): MetaData {
		return { url, title: '', description: '', type: 'unknown' };
	}

	private pickImage(images: ImageObject[], minWidth = 400): ImageObject | undefined {
		const sortedImages = [...images];
		sortedImages.sort((a, b) => (a.width && b.width ? Number(a.width) - Number(b.width) : 0));
		const smallestBigEnoughImage = sortedImages.find((i) => i.width && i.width >= minWidth);
		const fallbackImage = images[0] && images[0].width === undefined ? images[0] : undefined;
		return smallestBigEnoughImage ?? fallbackImage;
	}

	private async fetchHtmlPartly(url: string, maxLength = 50000): Promise<string> {
		const source = axios.CancelToken.source();
		let html = '';

		try {
			const response = await axios.get(url, {
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

			return html.slice(0, maxLength);
		} catch (error) {
			if (!axios.isCancel(error)) {
				throw error;
			}
			return html;
		}
	}
}
