import { Injectable } from '@nestjs/common';
import axios from 'axios';
import net from 'net';
import ogs from 'open-graph-scraper';
import { ImageObject } from 'open-graph-scraper/dist/lib/types';
import { MetaData } from '../types';

@Injectable()
export class MetaTagExternalUrlService {
	async tryExtractMetaTags(url: string): Promise<MetaData | undefined> {
		if (!this.isValidNetworkAddress(url)) {
			return undefined;
		}
		const html = await this.fetchHtmlPartly(url);
		const { result, error } = await ogs({ html });
		if (error) {
			// unable to parse html
			return undefined;
		}
		const { ogTitle, ogDescription, ogImage } = result;

		return {
			title: ogTitle ?? '',
			description: ogDescription ?? '',
			image: ogImage ? this.pickImage(ogImage) : undefined,
			url,
			type: 'external',
		};
	}

	private isValidNetworkAddress(url: string): boolean {
		let urlObject: URL;
		try {
			urlObject = new URL(url);
		} catch (error) {
			return false;
		}

		if (net.isIPv4(urlObject.hostname) || net.isIPv6(urlObject.hostname)) {
			//  Invalid url - IP adress as hostname is not allowed for external urls
			return false;
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
			// due to the fact, that it is very hard to mock the internal axios cancelation mechanism (including throwing this cancelation error),
			// the next line is not covered by tests
			// istanbul ignore next
			if (!axios.isCancel(error)) {
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
