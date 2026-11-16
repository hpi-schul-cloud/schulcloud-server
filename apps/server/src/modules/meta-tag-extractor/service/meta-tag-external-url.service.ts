import { Injectable } from '@nestjs/common';
import axios from 'axios';
import net from 'net';
import ogs from 'open-graph-scraper';
import { ImageObject } from 'open-graph-scraper/types/lib/types';
import { RequestFilteringHttpAgent, RequestFilteringHttpsAgent } from 'request-filtering-agent';
import { InvalidLinkUrlLoggableException } from '../loggable/invalid-link-url.loggable';
import { MetaData, MetaDataEntityType } from '../types';

@Injectable()
export class MetaTagExternalUrlService {
	// Prevent SSRF: the agents reject connections to private, loopback, link-local and other non-public IPs.
	// The check happens on the resolved IP at connect time, so it also covers DNS rebinding and redirects.
	private readonly httpAgent = new RequestFilteringHttpAgent();

	private readonly httpsAgent = new RequestFilteringHttpsAgent();

	public async tryExtractMetaTags(url: URL): Promise<MetaData | undefined> {
		try {
			const html = await this.fetchHtmlPartly(url);
			const result = await this.parseHtml(html);
			if (!result) {
				return undefined;
			}

			const { ogTitle, ogDescription, ogImage } = result;
			const imageUrl = this.getImageUrl(ogImage, url);
			const originalImageUrl = imageUrl && (await this.isAllowedImage(imageUrl)) ? imageUrl.toString() : undefined;

			return {
				title: ogTitle ?? '',
				description: ogDescription ?? '',
				originalImageUrl,
				url: url.toString(),
				type: MetaDataEntityType.EXTERNAL,
			};
		} catch {
			return undefined;
		}
	}

	private async parseHtml(
		html: string
	): Promise<{ ogTitle?: string; ogDescription?: string; ogImage: ImageObject[] } | undefined> {
		try {
			const { result } = await ogs({ html });
			return { ogImage: [], ...result };
		} catch {
			// unable to parse html
			return undefined;
		}
	}

	private async isAllowedImage(imageUrl: URL): Promise<boolean> {
		if (!this.isAllowedImageUrl(imageUrl)) {
			return false;
		}

		let image: { content: string; contentType?: string };
		try {
			image = await this.fetchImagePartly(imageUrl);
		} catch {
			return false;
		}

		const { content, contentType } = image;
		if (!content) {
			return true;
		}

		const isSvg =
			/\.svgz?$/i.test(imageUrl.pathname) ||
			/^image\/svg\+xml\b/i.test(contentType ?? '') ||
			this.isSvgContent(content);

		return !isSvg;
	}

	// same restrictions as for the page url (see MetaTagExtractorService.parseValidUrl)
	private isAllowedImageUrl(imageUrl: URL): boolean {
		const isHttps = imageUrl.protocol === 'https:';
		const isIpAddress = net.isIP(imageUrl.hostname.replace(/^\[|\]$/g, '')) !== 0;

		return isHttps && !isIpAddress;
	}

	private isSvgContent(content: string): boolean {
		const contentWithoutPreamble = content
			.replace(/^\uFEFF/, '')
			.replace(/<\?xml[\s\S]*?\?>/gi, '')
			.replace(/<!--[\s\S]*?-->/g, '')
			.replace(/<!DOCTYPE[^>[]*(\[[\s\S]*?\])?\s*>/gi, '')
			.trimStart();

		return /^<svg[\s>]/i.test(contentWithoutPreamble);
	}

	private async fetchHtmlPartly(url: URL, maxLength = 50000): Promise<string> {
		const { content } = await this.fetchContentPartly(url, maxLength, 'Unable to fetch html for meta tag extraction');
		return content;
	}

	private fetchImagePartly(url: URL, maxLength = 10000): Promise<{ content: string; contentType?: string }> {
		return this.fetchContentPartly(url, maxLength, 'Unable to fetch image for meta tag extraction');
	}

	private async fetchContentPartly(
		url: URL,
		maxLength: number,
		errorMessage: string
	): Promise<{ content: string; contentType?: string }> {
		const source = axios.CancelToken.source();
		let content = '';
		let contentType: string | undefined;

		try {
			const response = await axios.get(url.toString(), {
				headers: { 'User-Agent': 'Open Graph Scraper' },
				responseType: 'stream',
				cancelToken: source.token,
				httpAgent: this.httpAgent,
				httpsAgent: this.httpsAgent,
			});

			const headerValue: unknown = response.headers?.['content-type'];
			contentType = typeof headerValue === 'string' ? headerValue : undefined;

			const stream = response.data as NodeJS.ReadableStream;
			stream.on('data', (chunk: Buffer) => {
				content += chunk.toString('utf-8');
				if (content.length >= maxLength) {
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
				throw new InvalidLinkUrlLoggableException(url.toString(), errorMessage);
			}
		}
		return { content: content.slice(0, maxLength), contentType };
	}

	private getImageUrl(images: ImageObject[], url: URL): URL | undefined {
		const image = this.pickImage(images);
		if (!image) {
			return undefined;
		}

		const baseUrl = new URL(url.toString());
		baseUrl.pathname = '';

		const imageUrl = new URL(image.url, baseUrl.toString());
		return imageUrl;
	}

	private pickImage(images: ImageObject[], minWidth = 400): ImageObject | undefined {
		const sortedImages = [...images];
		sortedImages.sort((a, b) => (a.width && b.width ? Number(a.width) - Number(b.width) : 0));
		const smallestBigEnoughImage = sortedImages.find((i) => i.width && i.width >= minWidth);
		const fallbackImage = images[0] && images[0].width === undefined ? images[0] : undefined;
		return smallestBigEnoughImage ?? fallbackImage;
	}
}
