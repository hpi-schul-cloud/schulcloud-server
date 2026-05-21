import { ICurrentUser } from '@infra/auth-guard';
import {
	FileRecordParentType,
	FileRecordResponse,
	FilesStorageClientAdapter,
	StorageLocation,
} from '@infra/common-cartridge-clients';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { EventBus } from '@nestjs/cqrs';
import { JwtExtractor } from '@shared/common/utils';
import { EntityId } from '@shared/domain/types';
import busboy from 'busboy';
import { Request } from 'express';
import { COMMON_CARTRIDGE_CONFIG_TOKEN, CommonCartridgeConfig } from '../common-cartridge.config';
import { ImportCourseEvent } from '../domain/events/import-course.event';
import { ImportCourseParams } from '../domain/import-course.params';
import { CommonCartridgeVersion } from '../export/common-cartridge.enums';
import { CommonCartridgeExportService } from '../service';
import { CommonCartridgeExportResponse } from '../service/common-cartridge-export.response';
import { CommonCartridgeValidatorTransform } from '../util/common-cartridge-validator.transform';

@Injectable()
export class CommonCartridgeUc {
	constructor(
		private readonly exportService: CommonCartridgeExportService,
		private readonly fileClient: FilesStorageClientAdapter,
		private readonly eventBus: EventBus,
		@Inject(REQUEST) private readonly request: Request,
		@Inject(COMMON_CARTRIDGE_CONFIG_TOKEN) private readonly config: CommonCartridgeConfig
	) {}

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

	public async uploadFileFromRequestToTemp(currentUser: ICurrentUser): Promise<FileRecordResponse> {
		const jwt = JwtExtractor.extractJwtFromRequest(this.request);
		if (!jwt) {
			throw new UnauthorizedException();
		}

		const fileName = this.getFileName(this.request);

		const fileRecordResponse = await this.uploadFileWithBusboy(jwt, currentUser, this.request, fileName);

		return fileRecordResponse;
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

	// private: stream helper
	private uploadFileWithBusboy(
		jwt: string,
		currentUser: ICurrentUser,
		req: Request,
		fileName: string
	): Promise<FileRecordResponse> {
		return new Promise<FileRecordResponse>((resolve, reject) => {
			const bb = busboy({ headers: req.headers, defParamCharset: 'utf8' });
			const abortController = new AbortController();
			let fileRecordPromise: Promise<FileRecordResponse> | undefined;
			let isResolved = false;

			const cleanup = (): void => {
				req.unpipe(bb);
			};

			const safeReject = (error: unknown): void => {
				if (!isResolved) {
					isResolved = true;
					cleanup();
					reject(error);
				}
			};

			const safeResolve = (result: FileRecordResponse): void => {
				if (!isResolved) {
					isResolved = true;
					cleanup();
					resolve(result);
				}
			};

			req.on('close', () => {
				if (!req.complete) {
					abortController.abort();
					// TODO logging
					// this.logger.warning(
					// 	new UploadAbortLoggable('Upload request was closed prematurely by client', 'request_closed')
					// );
					safeReject(new Error('Request closed prematurely'));
				}
			});

			req.on('aborted', () => {
				abortController.abort();
				// TODO logging
				// this.logger.warning(new UploadAbortLoggable('Upload request was aborted by client', 'request_aborted'));
				safeReject(new Error('Request aborted by client'));
			});

			bb.on('file', (_name, file, _info) => {
				if (isResolved) return; // Already resolved/rejected

				const validator = new CommonCartridgeValidatorTransform(this.config.courseImportMaxFileSize);
				validator.on('validated', (isValid: boolean) => {
					if (!isValid) {
						validator.destroy();
						safeReject(new Error('Given file is not a zip archive'));
					}
				});

				file.pipe(validator);

				fileRecordPromise = this.fileClient.uploadTempFile(
					jwt,
					currentUser.schoolId,
					StorageLocation.SCHOOL,
					currentUser.userId,
					FileRecordParentType.USERS,
					validator,
					fileName,
					this.config.courseImportMaxFileSize
				);

				// Handle upload errors immediately
				fileRecordPromise.catch((error) => {
					safeReject(error);
				});
			});

			// eslint-disable-next-line @typescript-eslint/no-misused-promises
			bb.on('close', async () => {
				if (isResolved) return;

				if (fileRecordPromise instanceof Promise) {
					try {
						const fileRecord = await fileRecordPromise;
						safeResolve(fileRecord);
					} catch (error) {
						safeReject(error);
					}
				} else {
					safeReject(new Error('No file provided'));
				}
			});

			req.pipe(bb);
		});
	}
}
