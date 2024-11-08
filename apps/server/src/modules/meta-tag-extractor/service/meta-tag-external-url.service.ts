import { Injectable } from '@nestjs/common';
import net from 'net';
import axios from 'axios';
import ogs from 'open-graph-scraper';
import { ImageObject } from 'open-graph-scraper/dist/lib/types';
import { MetaData } from '../types';

@Injectable()
export class MetaTagExternalUrlService {
	async tryExtractMetaTags(url: string): Promise<MetaData | undefined> {
		try {
			if (this.isValidNetworkAddress(url)) {
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
			}
		} catch (error) {
			// log error
		}
		return undefined;
	}

	private isValidNetworkAddress(url: string): boolean {
		const urlObject = new URL(url);
		if (net.isIPv4(urlObject.hostname) || net.isIPv6(urlObject.hostname)) {
			throw new Error(`Invalid url - IP adress as hostname is not allowed for external urls: ${url}`);
		}
		return true;
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
		} catch (error) {
			if (!axios.isCancel(error)) {
				// log error
				throw error;
			}
		}
		return html.slice(0, maxLength);
	}

	private pickImage(images: ImageObject[], minWidth = 400): ImageObject | undefined {
		const sortedImages = [...images];
		sortedImages.sort((a, b) => (a.width && b.width ? Number(a.width) - Number(b.width) : 0));
		const smallestBigEnoughImage = sortedImages.find((i) => i.width && i.width >= minWidth);
		const fallbackImage = images[0] && images[0].width === undefined ? images[0] : undefined;
		return smallestBigEnoughImage ?? fallbackImage;
	}
}
