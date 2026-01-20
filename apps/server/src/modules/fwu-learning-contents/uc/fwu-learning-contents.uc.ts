import { LegacyLogger } from '@core/logger';
import { S3ClientAdapter } from '@infra/s3-client';
import { Inject, Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { Readable } from 'stream';
import { FWU_CONTENT_S3_CONNECTION } from '../fwu-learning-contents.config';
import { fwuIndex } from '../interface/fwuIndex.type';

@Injectable()
export class FwuLearningContentsUc {
	constructor(
		private logger: LegacyLogger,
		@Inject(FWU_CONTENT_S3_CONNECTION) private readonly storageClient: S3ClientAdapter
	) {
		this.logger.setContext(FwuLearningContentsUc.name);
	}

	public async get(path: string, bytesRange?: string) {
		const response = await this.storageClient.get(path, bytesRange);
		return response;
	}

	public async getList(filesIndex: string[]): Promise<fwuIndex[]> {
		const fwuList: fwuIndex[] = [];
		for (const fileId of filesIndex) {
			try {
				const response = await this.storageClient.get(`${fileId}/index.html`);
				const indexFileContent = await this.streamToString(response.data);
				if (!indexFileContent) continue;

				const $ = cheerio.load(indexFileContent);

				const title = $('.pname').text().trim();
				const description = $('.ptext').text().trim();
				const thumbnailUrl = this.extractThumbnailUrl($);
				fwuList.push({
					id: fileId,
					title,
					targetUrl: `/api/v3/fwu/${fileId}/index.html`,
					thumbnailUrl: `/api/v3/fwu/${fileId}/${thumbnailUrl}`,
					description,
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

	private extractThumbnailUrl(htmlContent: cheerio.CheerioAPI): string {
		const style = htmlContent('.player_outer').attr('style');

		let thumbnailUrl = '';
		if (style) {
			// Use a regular expression to find the URL within the style string
			const match = style.match(/url\((.*?)\)/);
			if (match && match[1]) {
				thumbnailUrl = match[1];
			}
		}

		return thumbnailUrl;
	}
}
