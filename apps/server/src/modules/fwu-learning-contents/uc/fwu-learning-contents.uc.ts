import { LegacyLogger } from '@core/logger';
import { GetFile, S3ClientAdapter } from '@infra/s3-client';
import { Inject, Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { Readable } from 'stream';
import { FWU_S3_CLIENT_INJECTION_TOKEN } from '../fwu.const';
import { FwuItem } from '../interface/fwu-item';

@Injectable()
export class FwuLearningContentsUc {
	constructor(
		private logger: LegacyLogger,
		@Inject(FWU_S3_CLIENT_INJECTION_TOKEN) private readonly storageClient: S3ClientAdapter
	) {
		this.logger.setContext(FwuLearningContentsUc.name);
	}

	public async get(path: string, bytesRange?: string): Promise<GetFile> {
		const response = await this.storageClient.get(path, bytesRange);

		return response;
	}

	public async getList(filesIndex: string[]): Promise<FwuItem[]> {
		const fwuList: FwuItem[] = [];
		for (const fileId of filesIndex) {
			try {
				const response = await this.storageClient.get(`${fileId}/index.html`);
				const indexFileContent = await this.streamToString(response.data);
				if (!indexFileContent) continue;

				const $ = cheerio.load(indexFileContent);

				const title = $('.pname').text().trim();
				const thumbnailUrl = this.extractThumbnailUrl($);
				fwuList.push({
					id: fileId,
					title,
					targetUrl: `/api/v3/fwu/${fileId}/index.html`,
					thumbnailUrl: thumbnailUrl ? `/api/v3/fwu/${fileId}/${thumbnailUrl}` : undefined,
				});
			} catch (error) {
				this.logger.error(`Failed to process file for id ${fileId}`, error);
			}
		}
		return fwuList;
	}

	private streamToString(stream: Readable): Promise<string> {
		const chunks: Buffer[] = [];
		return new Promise((resolve, reject) => {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
			stream.on('error', (err) => reject(err));
			stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
		});
	}

	private extractThumbnailUrl(htmlContent: cheerio.CheerioAPI): string | undefined {
		const style = htmlContent('.player_outer').attr('style');

		let thumbnailUrl: string | undefined;
		if (style) {
			// Use a regular expression to find the URL within the style string
			const match = style.match(/url\((['"]?)(.*?)\1\)/);
			if (match && match[2]) {
				thumbnailUrl = match[2];
			}
		}

		return thumbnailUrl;
	}
}
