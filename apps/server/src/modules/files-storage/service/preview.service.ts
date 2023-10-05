import { Inject, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { PreviewProducer } from '@shared/infra/preview-generator';
import { S3ClientAdapter } from '@shared/infra/s3-client';
import { LegacyLogger } from '@src/core/logger';
import { PreviewParams } from '../controller/dto';
import { FileRecord, PreviewStatus } from '../entity';
import { ErrorType } from '../error';
import { FILES_STORAGE_S3_CONNECTION } from '../files-storage.config';
import { createPath, createPreviewDirectoryPath, createPreviewFilePath, createPreviewNameHash } from '../helper';
import { GetFileResponse, PreviewFileParams } from '../interface';
import { PreviewOutputMimeTypes } from '../interface/preview-output-mime-types.enum';
import { FileResponseBuilder } from '../mapper';

@Injectable()
export class PreviewService {
	constructor(
		@Inject(FILES_STORAGE_S3_CONNECTION) private readonly storageClient: S3ClientAdapter,
		private logger: LegacyLogger,
		private readonly previewProducer: PreviewProducer
	) {
		this.logger.setContext(PreviewService.name);
	}

	public async getPreview(
		fileRecord: FileRecord,
		previewParams: PreviewParams,
		bytesRange?: string
	): Promise<GetFileResponse> {
		this.checkIfPreviewPossible(fileRecord);

		const { schoolId, id, mimeType } = fileRecord;
		const originFilePath = createPath(schoolId, id);
		const format = this.getFormat(previewParams.outputFormat ?? mimeType);

		const hash = createPreviewNameHash(id, previewParams);
		const previewFilePath = createPreviewFilePath(schoolId, hash, id);

		const previewFileParams = {
			fileRecord,
			previewParams,
			hash,
			previewFilePath,
			originFilePath,
			format,
			bytesRange,
		};

		if (previewParams.forceUpdate) {
			await this.generatePreview(previewFileParams);
		}

		const response = await this.tryGetPreviewOrGenerate(previewFileParams);

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

			await this.generatePreview(params);
			file = await this.getPreviewFile(params);
		}

		return file;
	}

	private async getPreviewFile(params: PreviewFileParams): Promise<GetFileResponse> {
		const { fileRecord, previewFilePath, bytesRange, previewParams } = params;
		const name = this.getPreviewName(fileRecord, previewParams.outputFormat);
		const file = await this.storageClient.get(previewFilePath, bytesRange);

		const response = FileResponseBuilder.build(file, name);

		return response;
	}

	private async generatePreview(params: PreviewFileParams): Promise<void> {
		const payload = {
			originFilePath: params.originFilePath,
			previewFilePath: params.previewFilePath,
			previewOptions: { width: params.previewParams.width, format: params.format },
		};

		await this.previewProducer.generate(payload);
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
