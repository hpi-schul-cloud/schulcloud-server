import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
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

interface PreviewFileParams {
	fileRecord: FileRecord;
	downloadParams: DownloadFileParams;
	previewParams: PreviewParams;
	hash: string;
	filePath: string;
	bytesRange?: string;
}

@Injectable()
export class PreviewService {
	constructor(
		private readonly storageClient: S3ClientAdapter,
		private readonly fileStorageService: FilesStorageService,
		private logger: LegacyLogger
	) {
		this.logger.setContext(PreviewService.name);
	}

	public async getPreview(
		fileRecord: FileRecord,
		downloadParams: DownloadFileParams,
		previewParams: PreviewParams,
		bytesRange?: string
	): Promise<IGetFileResponse> {
		this.checkIfPreviewPossible(fileRecord);

		const { forceUpdate, outputFormat } = previewParams;
		const hash = this.createNameHash(downloadParams, previewParams);
		const filePath = this.getFilePath(fileRecord, hash);
		const name = this.getPreviewName(fileRecord, outputFormat);
		let file: IGetFile;

		const previewFileParams = { fileRecord, downloadParams, previewParams, hash, filePath, bytesRange };

		if (forceUpdate) {
			file = await this.generatePreview(previewFileParams);
		} else {
			file = await this.tryGetPreviewOrGenerate(previewFileParams);
		}

		const response = FileResponseBuilder.build(file, name);

		return response;
	}

	private checkIfPreviewPossible(fileRecord: FileRecord): void | UnprocessableEntityException {
		if (!fileRecord.isPreviewPossible()) {
			this.logger.warn(`could not generate preview for : ${fileRecord.id} ${fileRecord.mimeType}`);
			throw new UnprocessableEntityException(ErrorType.PREVIEW_NOT_POSSIBLE);
		}
	}

	private async tryGetPreviewOrGenerate(params: PreviewFileParams): Promise<IGetFile> {
		const { filePath, bytesRange } = params;
		let file: IGetFile;

		try {
			file = await this.storageClient.get(filePath, bytesRange);
		} catch (error) {
			if (!(error instanceof NotFoundException)) {
				throw error;
			}

			file = await this.generatePreview(params);
		}

		return file;
	}

	private createNameHash(params: DownloadFileParams, previewParams: PreviewParams): string {
		const width = previewParams.width ?? '';
		const height = previewParams.height ?? '';
		const format = previewParams.outputFormat ?? '';
		const fileParamsString = `${params.fileRecordId}${width}${height}${format}`;
		const hash = crypto.createHash('md5').update(fileParamsString).digest('hex');

		return hash;
	}

	private async generatePreview(params: PreviewFileParams): Promise<IGetFile> {
		const { fileRecord, downloadParams, previewParams, hash, filePath, bytesRange } = params;

		const original = await this.fileStorageService.download(fileRecord, downloadParams, bytesRange);
		const preview = this.resizeAndConvert(original, fileRecord, previewParams);

		const format = previewParams.outputFormat ?? fileRecord.mimeType;
		const fileDto = FileDtoBuilder.build(hash, preview, format);
		await this.storageClient.create(filePath, fileDto);

		const response = await this.storageClient.get(filePath, bytesRange);

		return response;
	}

	private resizeAndConvert(
		original: IGetFileResponse,
		fileRecord: FileRecord,
		previewParams: PreviewParams
	): PassThrough {
		const mimeType = previewParams.outputFormat ?? fileRecord.mimeType;
		const format = this.getFormat(mimeType);
		const im = subClass({ imageMagick: true });

		const preview = im(original.data, fileRecord.name);
		const { width, height } = previewParams;

		if (width) {
			preview.resize(width, height);
		}

		const result = preview.stream(format);

		return result;
	}

	private getFormat(mimeType: string): string {
		const format = mimeType.split('/')[1];

		return format;
	}

	private getPreviewName(fileRecord: FileRecord, outputFormat?: PreviewOutputMimeTypes): string {
		if (!outputFormat) {
			return fileRecord.name;
		}

		const fileNameWithoutExtension = fileRecord.name.split('.')[0];
		const format = this.getFormat(outputFormat);
		const name = `${fileNameWithoutExtension}.${format}`;

		return name;
	}

	private getFilePath(fileRecord: FileRecord, hash: string): string {
		const path = ['previews', fileRecord.getSchoolId(), hash].join('/');

		return path;
	}
}
