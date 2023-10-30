import { Inject, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { S3ClientAdapter } from '@shared/infra/s3-client';
import { LegacyLogger } from '@src/core/logger';
import { subClass } from 'gm';
import { PassThrough } from 'stream';
import { DownloadFileParams, PreviewParams } from '../controller/dto';
import { FileRecord, PreviewStatus } from '../entity';
import { ErrorType } from '../error';
import { FILES_STORAGE_S3_CONNECTION } from '../files-storage.config';
import { createPreviewDirectoryPath, createPreviewFilePath, createPreviewNameHash } from '../helper';
import { GetFileResponse, PreviewFileParams } from '../interface';
import { PreviewOutputMimeTypes } from '../interface/preview-output-mime-types.enum';
import { FileDtoBuilder, FileResponseBuilder } from '../mapper';
import { FilesStorageService } from './files-storage.service';

@Injectable()
export class PreviewService {
	constructor(
		@Inject(FILES_STORAGE_S3_CONNECTION) private readonly storageClient: S3ClientAdapter,
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
	): Promise<GetFileResponse> {
		this.checkIfPreviewPossible(fileRecord);

		const hash = createPreviewNameHash(fileRecord.id, previewParams);
		const filePath = createPreviewFilePath(fileRecord.getSchoolId(), hash, fileRecord.id);

		let response: GetFileResponse;

		const previewFileParams = { fileRecord, downloadParams, previewParams, hash, filePath, bytesRange };

		if (previewParams.forceUpdate) {
			response = await this.generatePreview(previewFileParams);
		} else {
			response = await this.tryGetPreviewOrGenerate(previewFileParams);
		}

		return response;
	}

	public async deletePreviews(fileRecords: FileRecord[]): Promise<void> {
		try {
			const paths = fileRecords.map((fileRecord) =>
				createPreviewDirectoryPath(fileRecord.getSchoolId(), fileRecord.id)
			);

			const promises = paths.map((path) => this.storageClient.deleteDirectory(path));

			await Promise.all(promises);
		} catch (error) {
			this.logger.warn(error);
		}
	}

	private checkIfPreviewPossible(fileRecord: FileRecord): void | UnprocessableEntityException {
		if (fileRecord.getPreviewStatus() !== PreviewStatus.PREVIEW_POSSIBLE) {
			this.logger.warn(`could not generate preview for : ${fileRecord.id} ${fileRecord.mimeType}`);
			throw new UnprocessableEntityException(ErrorType.PREVIEW_NOT_POSSIBLE);
		}
	}

	private async tryGetPreviewOrGenerate(params: PreviewFileParams): Promise<GetFileResponse> {
		let file: GetFileResponse;

		try {
			file = await this.getPreviewFile(params);
		} catch (error) {
			if (!(error instanceof NotFoundException)) {
				throw error;
			}

			file = await this.generatePreview(params);
		}

		return file;
	}

	private async getPreviewFile(params: PreviewFileParams): Promise<GetFileResponse> {
		const { fileRecord, filePath, bytesRange, previewParams } = params;
		const name = this.getPreviewName(fileRecord, previewParams.outputFormat);
		const file = await this.storageClient.get(filePath, bytesRange);

		const response = FileResponseBuilder.build(file, name);

		return response;
	}

	private async generatePreview(params: PreviewFileParams): Promise<GetFileResponse> {
		const { fileRecord, downloadParams, previewParams, hash, filePath, bytesRange } = params;

		const original = await this.fileStorageService.download(fileRecord, downloadParams, bytesRange);
		const preview = this.resizeAndConvert(original, fileRecord, previewParams);

		const format = previewParams.outputFormat ?? fileRecord.mimeType;
		const fileDto = FileDtoBuilder.build(hash, preview, format);
		await this.storageClient.create(filePath, fileDto);

		const response = await this.getPreviewFile(params);

		return response;
	}

	private resizeAndConvert(
		original: GetFileResponse,
		fileRecord: FileRecord,
		previewParams: PreviewParams
	): PassThrough {
		const mimeType = previewParams.outputFormat ?? fileRecord.mimeType;
		const format = this.getFormat(mimeType);
		const im = subClass({ imageMagick: '7+' });

		const preview = im(original.data, fileRecord.name);
		const { width } = previewParams;

		if (width) {
			preview.resize(width, undefined, '>');
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
}
