import { Injectable } from '@nestjs/common';
import axios from 'axios';
import net from 'node:net';
import ogs from 'open-graph-scraper';
import { ImageObject } from 'open-graph-scraper/types/lib/types';
import { posix } from 'node:path';
import { RequestFilteringHttpAgent, RequestFilteringHttpsAgent } from 'request-filtering-agent';
import { InvalidLinkUrlLoggableException } from '../loggable/invalid-link-url.loggable';
import { MetaData, MetaDataEntityType } from '../types';

const FETCH_TIMEOUT_MS = 10000;

const BINARY_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'];
const DYNAMIC_IMAGE_EXTENSIONS = ['.php', '.asp', '.aspx', '.ashx', '.jsp', '.do', '.action', '.cfm', '.cgi', '.pl'];
const SUPPORTED_IMAGE_EXTENSIONS = new Set([...BINARY_IMAGE_EXTENSIONS, ...DYNAMIC_IMAGE_EXTENSIONS]);

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

		let image: { content: Buffer; contentType?: string };
		try {
			image = await this.fetchImagePartly(imageUrl);
		} catch {
			return false;
		}

		const { content, contentType } = image;
		const isDeclaredAsSvg = /\.svgz?$/i.test(imageUrl.pathname) || /^image\/svg\+xml\b/i.test(contentType ?? '');

		return !isDeclaredAsSvg && this.isSupportedRasterImage(content);
	}

	// same restrictions as for the page url (see MetaTagExtractorService.parseValidUrl)
	private isAllowedImageUrl(imageUrl: URL): boolean {
		const isHttps = imageUrl.protocol === 'https:';
		const isIpAddress = net.isIP(imageUrl.hostname.replace(/^\[|\]$/g, '')) !== 0;

		return isHttps && !isIpAddress;
	}

	// Allowlist by magic bytes: anything not positively identified (e.g. SVG in any XML form, empty or truncated content) is rejected.
	private isSupportedRasterImage(content: Buffer): boolean {
		const startsWith = (bytes: number[], offset = 0): boolean =>
			content.length >= offset + bytes.length && bytes.every((byte, index) => content[offset + index] === byte);
		const asciiAt = (text: string, offset = 0): boolean =>
			content.subarray(offset, offset + text.length).toString('latin1') === text;

		const isJpeg = startsWith([0xff, 0xd8, 0xff]);
		const isPng = startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
		const isGif = asciiAt('GIF87a') || asciiAt('GIF89a');
		const isWebp = asciiAt('RIFF') && asciiAt('WEBP', 8);
		const isAvif = this.isAvif(content);

		return isJpeg || isPng || isGif || isWebp || isAvif;
	}

	private isAvif(content: Buffer): boolean {
		const asciiAt = (text: string, offset = 0): boolean =>
			content.subarray(offset, offset + text.length).toString('latin1') === text;

		if (asciiAt('ftyp', 4)) {
			const boxEnd = Math.min(content.readUInt32BE(0), content.length);
			for (let offset = 8; offset + 4 <= boxEnd; offset += 4) {
				if (offset !== 12 && (asciiAt('avif', offset) || asciiAt('avis', offset))) {
					return true;
				}
			}
		}
		return false;
	}

	private async fetchHtmlPartly(url: URL, maxLength = 50000, timeoutMs = FETCH_TIMEOUT_MS): Promise<string> {
		const { content } = await this.fetchContentPartly(
			url,
			maxLength,
			timeoutMs,
			'Unable to fetch html for meta tag extraction'
		);
		return content.toString('utf-8').slice(0, maxLength);
	}

	private fetchImagePartly(
		url: URL,
		maxLength = 64,
		timeoutMs = FETCH_TIMEOUT_MS
	): Promise<{ content: Buffer; contentType?: string }> {
		return this.fetchContentPartly(url, maxLength, timeoutMs, 'Unable to fetch image for meta tag extraction');
	}

	private async fetchContentPartly(
		url: URL,
		maxLength: number,
		timeoutMs: number,
		errorMessage: string
	): Promise<{ content: Buffer; contentType?: string }> {
		const source = axios.CancelToken.source();
		const chunks: Buffer[] = [];
		let receivedLength = 0;
		let contentType: string | undefined;
		let stream: NodeJS.ReadableStream | undefined;
		let timedOut = false;
		let deadlineTimer: NodeJS.Timeout | undefined;

		// absolute deadline covering connection, headers and body streaming
		const deadline = new Promise<never>((_resolve, reject) => {
			deadlineTimer = setTimeout(() => {
				timedOut = true;
				source.cancel(`Request canceled after ${timeoutMs} ms.`);
				(stream as { destroy?: () => void } | undefined)?.destroy?.();
				reject(new Error(`Request timed out after ${timeoutMs} ms.`));
			}, timeoutMs);
		});

		const download = async (): Promise<void> => {
			const response = await axios.get(url.toString(), {
				headers: { 'User-Agent': 'Open Graph Scraper' },
				responseType: 'stream',
				cancelToken: source.token,
				httpAgent: this.httpAgent,
				httpsAgent: this.httpsAgent,
			});

			const headerValue: unknown = response.headers?.['content-type'];
			contentType = typeof headerValue === 'string' ? headerValue : undefined;

			const responseStream = response.data as NodeJS.ReadableStream;
			stream = responseStream;
			responseStream.on('data', (chunk: Buffer | string) => {
				const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
				chunks.push(buffer);
				receivedLength += buffer.length;
				if (receivedLength >= maxLength) {
					source.cancel(`Request canceled after receiving ${maxLength} bytes.`);
				}
			});

			await new Promise((resolve, reject) => {
				responseStream.on('end', resolve);
				// axios destroys the stream without an error when the request is canceled
				responseStream.on('close', resolve);
				responseStream.on('error', reject);
			});
		};

		try {
			await Promise.race([download(), deadline]);
		} catch (error) {
			// mocking the internal axios cancelation mechanism (including throwing this cancelation error) was not possible... so:
			// istanbul ignore next
			if (timedOut || !axios.isCancel(error)) {
				throw new InvalidLinkUrlLoggableException(url.toString(), errorMessage);
			}
		} finally {
			clearTimeout(deadlineTimer);
		}
		return { content: Buffer.concat(chunks).subarray(0, maxLength), contentType };
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
		const supportedImages = images.filter((image) => this.hasSupportedFileExtension(image.url));
		const sortedImages = [...supportedImages];
		sortedImages.sort((a, b) => (a.width && b.width ? Number(a.width) - Number(b.width) : 0));
		const smallestBigEnoughImage = sortedImages.find((i) => i.width && i.width >= minWidth);
		const fallbackImage = supportedImages[0] && supportedImages[0].width === undefined ? supportedImages[0] : undefined;
		return smallestBigEnoughImage ?? fallbackImage;
	}

	private hasSupportedFileExtension(imageUrl: string): boolean {
		try {
			const { pathname } = new URL(imageUrl, 'https://base.invalid');
			const extension = posix.extname(pathname).toLowerCase();

			return extension === '' || SUPPORTED_IMAGE_EXTENSIONS.has(extension);
		} catch {
			return false;
		}
	}
}
