import { Injectable, InternalServerErrorException, NotAcceptableException } from '@nestjs/common';
import { LegacyLogger } from '@src/core/logger';
import crypto from 'crypto';
import { subClass } from 'gm';
import { PassThrough } from 'stream';
import { S3ClientAdapter } from '../client/s3-client.adapter';
import { DownloadFileParams, PreviewParams } from '../controller/dto';
import { FileRecord } from '../entity';
import { ErrorType } from '../error';
import { IGetFile, IGetFileResponse } from '../interface';
import { PreviewOutputMimeTypes } from '../interface/preview-output-mime-types.enum';
import { FileDtoBuilder, FileResponseBuilder } from '../mapper';
import { FilesStorageService } from './files-storage.service';

@Injectable()
export class PreviewService {
	constructor(
		private readonly storageClient: S3ClientAdapter,
		private readonly fileStorageService: FilesStorageService,
		private logger: LegacyLogger
	) {
		this.logger.setContext(PreviewService.name);
	}

	private checkIfPreviewPossible(fileRecord: FileRecord): void | NotAcceptableException {
		if (!fileRecord.isPreviewPossible()) {
			this.logger.warn(`could not generate preview for : ${fileRecord.id} ${fileRecord.mimeType}`);
			throw new NotAcceptableException(ErrorType.PREVIEW_NOT_POSSIBLE);
		}
	}

	public async getPreview(
		fileRecord: FileRecord,
		params: DownloadFileParams,
		previewParams: PreviewParams,
		bytesRange?: string
	): Promise<IGetFileResponse> {
		this.checkIfPreviewPossible(fileRecord);

		const hash = this.createNameHash(params, previewParams);
		const filePath = ['previews', fileRecord.getSchoolId(), hash].join('/');
		const fileNameWithoutExtension = fileRecord.name.split('.')[0];
		const format = this.getFormat(previewParams.outputFormat);
		const name = `${fileNameWithoutExtension}.${format}`;
		let file: IGetFile;

		try {
			file = await this.storageClient.get(filePath, bytesRange);
		} catch (error) {
			this.throwIfOtherError(error);

			file = await this.generatePreview(fileRecord, params, previewParams, hash, filePath, bytesRange);
		}

		const response = FileResponseBuilder.build(file, name);

		return response;
	}

	private throwIfOtherError(error): void | InternalServerErrorException {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		if (error.message && error.message !== 'NoSuchKey') {
			throw error;
		}
	}

	private createNameHash(params: DownloadFileParams, previewParams: PreviewParams): string {
		const fileParamsString = `${params.fileRecordId}${previewParams.width}${previewParams.height}${previewParams.outputFormat}`;
		const hash = crypto.createHash('md5').update(fileParamsString).digest('hex');

		return hash;
	}

	private async generatePreview(
		fileRecord: FileRecord,
		params: DownloadFileParams,
		previewParams: PreviewParams,
		hash: string,
		filePath: string,
		bytesRange?: string
	): Promise<IGetFile> {
		const original = await this.fileStorageService.download(fileRecord, params, bytesRange);
		const preview = this.resizeAndConvert(original, fileRecord, previewParams);

		const fileDto = FileDtoBuilder.build(hash, preview, previewParams.outputFormat);
		await this.storageClient.create(filePath, fileDto);

		const response = await this.storageClient.get(filePath, bytesRange);

		return response;
	}

	private resizeAndConvert(
		original: IGetFileResponse,
		fileRecord: FileRecord,
		previewParams: PreviewParams
	): PassThrough {
		const format = this.getFormat(previewParams.outputFormat);
		const im = subClass({ imageMagick: true });
		const preview = im(original.data, fileRecord.name).resize(previewParams.width, previewParams.height).stream(format);

		return preview;
	}

	private getFormat(mimeType: PreviewOutputMimeTypes): string {
		const format = mimeType.split('/')[1];

		return format;
	}
}
