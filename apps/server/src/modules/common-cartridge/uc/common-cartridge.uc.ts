import { FilesStorageClientAdapter } from '@infra/common-cartridge-clients';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { EventBus } from '@nestjs/cqrs';
import { JwtExtractor } from '@shared/common/utils';
import { EntityId } from '@shared/domain/types';
import { Request } from 'express';
import { COMMON_CARTRIDGE_CONFIG_TOKEN, CommonCartridgeConfig } from '../common-cartridge.config';
import { FileSizeExceededLoggableException } from '../domain/errors';
import { ImportCourseEvent } from '../domain/events/import-course.event';
import { ImportCourseParams } from '../domain/import-course.params';
import { CommonCartridgeVersion } from '../export/common-cartridge.enums';
import { CommonCartridgeExportService } from '../service';
import { CommonCartridgeExportResponse } from '../service/common-cartridge-export.response';

@Injectable()
export class CommonCartridgeUc {
	constructor(
		private readonly exportService: CommonCartridgeExportService,
		private readonly eventBus: EventBus,
		private readonly filesStorageClient: FilesStorageClientAdapter,
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

	public async startCourseImport(params: ImportCourseParams): Promise<void> {
		const jwt = JwtExtractor.extractJwtFromRequest(this.request);

		if (!jwt) {
			throw new UnauthorizedException();
		}

		const fileRecord = await this.filesStorageClient.getFileRecord(jwt, params.fileRecordId);

		if (fileRecord.size > this.config.courseImportMaxFileSize) {
			throw new FileSizeExceededLoggableException(fileRecord.size, this.config.courseImportMaxFileSize);
		}

		this.eventBus.publish(new ImportCourseEvent(jwt, params.fileRecordId, params.fileName, params.fileUrl));
	}
}
