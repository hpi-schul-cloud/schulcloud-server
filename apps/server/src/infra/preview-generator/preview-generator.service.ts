import { Injectable } from '@nestjs/common';
import { GetFile, S3ClientAdapter } from '@infra/s3-client';
import { Logger } from '@src/core/logger';
import { subClass } from 'gm';
import { PassThrough } from 'stream';
import { PreviewFileOptions, PreviewOptions, PreviewResponseMessage } from './interface';
import { PreviewActionsLoggable } from './loggable/preview-actions.loggable';
import { PreviewGeneratorBuilder } from './preview-generator.builder';

@Injectable()
export class PreviewGeneratorService {
	private imageMagick = subClass({ imageMagick: '7+' });

	constructor(private readonly storageClient: S3ClientAdapter, private logger: Logger) {
		this.logger.setContext(PreviewGeneratorService.name);
	}

	public async generatePreview(params: PreviewFileOptions): Promise<PreviewResponseMessage> {
		this.logger.debug(new PreviewActionsLoggable('PreviewGeneratorService.generatePreview:start', params));
		const { originFilePath, previewFilePath, previewOptions } = params;

		const original = await this.downloadOriginFile(originFilePath);
		const preview = this.resizeAndConvert(original, previewOptions);

		const file = PreviewGeneratorBuilder.buildFile(preview, params.previewOptions);

		await this.storageClient.create(previewFilePath, file);

		this.logger.debug(new PreviewActionsLoggable('PreviewGeneratorService.generatePreview:end', params));

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
		const { format, width } = previewParams;

		const preview = this.imageMagick(original.data);

		if (width) {
			preview.resize(width, undefined, '>');
		}

		const result = preview.stream(format);

		return result;
	}
}
