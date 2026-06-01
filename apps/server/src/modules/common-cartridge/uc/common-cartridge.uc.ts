import { ICurrentUser } from '@infra/auth-guard';
import {
	FileRecordParentType,
	FileRecordResponse,
	FilesStorageClientAdapter,
	StorageLocation,
} from '@infra/common-cartridge-clients';
import { BadRequestException, ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { EventBus } from '@nestjs/cqrs';
import { JwtExtractor } from '@shared/common/utils';
import { EntityId } from '@shared/domain/types';
import { Request } from 'express';
import { COMMON_CARTRIDGE_PUBLIC_API_CONFIG_TOKEN, CommonCartridgePublicApiConfig } from '../common-cartridge.config';
import { ImportCourseEvent } from '../domain/events/import-course.event';
import { ImportCourseParams } from '../domain/import-course.params';
import { ErrorStatus } from '../error/error-status.enum';
import { CommonCartridgeVersion } from '../export/common-cartridge.enums';
import { CommonCartridgeExportService } from '../service';
import { CommonCartridgeExportResponse } from '../service/common-cartridge-export.response';
import {
	CC_VALIDATION_ERROR_EVENT,
	CcValidationErrorType,
	CommonCartridgeValidatorTransform,
} from '../util/common-cartridge-validator.transform';

@Injectable()
export class CommonCartridgeUc {
	constructor(
		private readonly exportService: CommonCartridgeExportService,
		private readonly fileClient: FilesStorageClientAdapter,
		private readonly eventBus: EventBus,
		@Inject(REQUEST) private readonly request: Request,
		@Inject(COMMON_CARTRIDGE_PUBLIC_API_CONFIG_TOKEN) private readonly config: CommonCartridgePublicApiConfig
	) {}

	public checkExportEnabled(): void {
		if (!this.config.courseExportEnabled) {
			throw new ForbiddenException(ErrorStatus.EXPORT_FEATURE_DISABLED, '');
		}
	}

	public async exportCourse(
		courseId: EntityId,
		version: CommonCartridgeVersion,
		topics: string[],
		tasks: string[],
		columnBoards: string[]
	): Promise<CommonCartridgeExportResponse> {
		const jwt = JwtExtractor.extractJwtFromRequest(this.request);

		if (!jwt) {
			throw new UnauthorizedException();
		}

		const exportedCourse = await this.exportService.exportCourse(jwt, courseId, version, topics, tasks, columnBoards);

		return exportedCourse;
	}

	public startCourseImport(params: ImportCourseParams): void {
		const jwt = JwtExtractor.extractJwtFromRequest(this.request);

		if (!jwt) {
			throw new UnauthorizedException();
		}

		this.eventBus.publish(new ImportCourseEvent(jwt, params.fileRecordId, params.fileName, params.fileUrl));
	}

	public checkImportEnabled(): void {
		if (!this.config.courseImportEnabled) {
			throw new ForbiddenException(ErrorStatus.IMPORT_FEATURE_DISABLED);
		}
	}

	public uploadFileFromRequestToTemp(currentUser: ICurrentUser): Promise<FileRecordResponse> {
		const jwt = JwtExtractor.extractJwtFromRequest(this.request);
		if (!jwt) {
			return Promise.reject(new UnauthorizedException());
		}

		const fileName = this.getFileName(this.request);
		const validator = new CommonCartridgeValidatorTransform(this.config.courseImportMaxFileSize);

		return new Promise<FileRecordResponse>((resolve, reject) => {
			let isResolved = false;
			const settle = (fn: () => void): void => {
				if (!isResolved) {
					isResolved = true;
					fn();
				}
			};

			this.request.on('close', () => {
				if (!this.request.complete) {
					settle(() => reject(new Error('Request closed prematurely')));
				}
			});

			this.request.on('aborted', () => {
				settle(() => reject(new Error('Request aborted by client')));
			});

			validator.on(CC_VALIDATION_ERROR_EVENT, (errorType: CcValidationErrorType) => {
				if (errorType === CcValidationErrorType.NotAZipFile) {
					settle(() => reject(new BadRequestException('Given file is not a zip archive')));
				} else if (errorType === CcValidationErrorType.MaximumSizeExceeded) {
					settle(() => reject(new BadRequestException('Maximum file size exceeded')));
				}
			});

			this.request.pipe(validator);

			this.fileClient
				.uploadTempFile(
					jwt,
					currentUser.schoolId,
					StorageLocation.SCHOOL,
					currentUser.userId,
					FileRecordParentType.USERS,
					validator,
					fileName
				)
				.then((result) =>
					settle(() => (result ? resolve(result) : reject(new Error('Error while uploading temp file. No result'))))
				)
				.catch((err: unknown) => settle(() => reject(err)));
		});
	}

	private getFileName(req: Request): string {
		const contentDisposition = req.headers['content-disposition'];

		let fileName = 'upload.imscc';
		if (contentDisposition) {
			const filenameMatch = contentDisposition.match(/filename[*]?=['"]?(?:UTF-8'')?([^;'"\n]+)['"]?/i);
			if (filenameMatch?.[1]) {
				fileName = decodeURIComponent(filenameMatch[1]);
			}
		}

		return fileName;
	}
}
