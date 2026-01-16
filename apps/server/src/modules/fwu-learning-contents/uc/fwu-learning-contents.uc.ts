import * as cheerio from 'cheerio';
import { Inject, Injectable } from '@nestjs/common';
import { S3ClientAdapter } from '@infra/s3-client';
import { LegacyLogger } from '@core/logger';
import { FWU_CONTENT_S3_CONNECTION } from '../fwu-learning-contents.config';
import { fwuIndex } from '../interface/fwuIndex.type';
import { Readable } from 'stream';

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

	public async getList(): Promise<fwuIndex[]> {
		const filesIndex = [
			'5501191',
			'5501193',
			'5501202',
			'5501207',
			'5501211',
			'5501213',
			'5501219',
			'5501222',
			'5501224',
			'5501225',
			'5501234',
			'5501235',
			'5501238',
			'5501239',
			'5501245',
			'5501248',
			'5501252',
			'5501259',
			'5501267',
			'5501454',
			'5501458',
			'5501460',
			'5501472',
			'5501478',
			'5501588',
			'5501595',
			'5501597',
			'5501630',
			'5501638',
			'5501649',
			'5501655',
			'5501656',
			'5501657',
			'5501665',
			'5501685',
			'5511001',
			'5511002',
			'5511003',
			'5511004',
			'5511005',
			'5511006',
			'5511018',
			'5511019',
			'5511024',
			'5511044',
			'5511045',
			'5511050',
			'5511057',
			'5511089',
			'5511093',
			'5511094',
			'5511095',
			'5511098',
			'5511099',
			'5511100',
			'5511102',
			'5511106',
			'5511123',
			'5511128',
			'5511138',
			'5511184',
			'5511356',
			'5521211',
			'5521227',
			'5521287',
			'5521289',
			'5521310',
			'5521344',
			'5521345',
			'5521348',
			'5521354',
			'5521366',
			'5521370',
			'5521405',
			'5521408',
			'5521411',
			'5521413',
			'5521415',
			'5521418',
			'5521427',
		];

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
					target_url: `/api/v3/fwu/${fileId}/index.html`,
					thumbnail_url: `/api/v3/fwu/${fileId}/${thumbnailUrl}`,
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
