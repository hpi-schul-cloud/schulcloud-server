import { Inject, Injectable } from '@nestjs/common';
import { GetFile, S3ClientAdapter } from '@shared/infra/s3-client';
import { LegacyLogger } from '@src/core/logger';
import { subClass } from 'gm';
import { PassThrough } from 'stream';
import { FILES_STORAGE_S3_CONNECTION } from '../files-storage.config';
import { PreviewFileOptions, PreviewOptions, PreviewResponseMessage } from '../interface';

@Injectable()
export class PreviewGeneratorService {
	constructor(
		@Inject(FILES_STORAGE_S3_CONNECTION) private readonly storageClient: S3ClientAdapter,
		private logger: LegacyLogger
	) {
		this.logger.setContext(PreviewGeneratorService.name);
	}

	public async generatePreview(params: PreviewFileOptions): Promise<PreviewResponseMessage> {
		const { originFilePath, previewFilePath, previewOptions } = params;

		const original = await this.downloadOriginFile(originFilePath);
		const preview = this.resizeAndConvert(original, previewOptions);

		const file = { data: preview, mimeType: previewOptions.format };
		await this.storageClient.create(previewFilePath, file);

		return {
			previewFilePath,
			status: true,
		};
	}

	private async downloadOriginFile(pathToFile: string): Promise<GetFile> {
		const file = await this.storageClient.get(pathToFile);

		return file;
	}

	private resizeAndConvert(original: GetFile, previewParams: PreviewOptions): PassThrough {
		const { format } = previewParams;
		const im = subClass({ imageMagick: '7+' });

		const preview = im(original.data);
		const { width } = previewParams;

		if (width) {
			preview.resize(width, undefined, '>');
		}

		const result = preview.stream(format);

		return result;
	}
}
