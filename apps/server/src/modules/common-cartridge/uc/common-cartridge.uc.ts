import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { EventBus } from '@nestjs/cqrs';
import { JwtExtractor } from '@shared/common/utils';
import { EntityId } from '@shared/domain/types';
import { ImportCourseEvent } from '../domain/events/import-course.event';
import { ImportCourseParams } from '../domain/import-course.params';
import { CommonCartridgeVersion } from '../export/common-cartridge.enums';
import { CommonCartridgeExportService } from '../service';
import { CommonCartridgeExportResponse } from '../service/common-cartridge-export.response';
import { Request } from 'express';
import { FilesStorageClientAdapter, StorageLocation } from '@infra/common-cartridge-clients';
import { ICurrentUser } from '@infra/auth-guard';
import { FileRecordParentType } from '@infra/common-cartridge-clients';
import { Readable } from 'stream';

@Injectable()
export class CommonCartridgeUc {
	constructor(
		private readonly exportService: CommonCartridgeExportService,
		private readonly fileClient: FilesStorageClientAdapter,
		private readonly eventBus: EventBus,
		@Inject(REQUEST) private readonly request: Request
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

	public async validateCcFile(currentUser: ICurrentUser, req: Readable) {
		let fileSize = 0;

		req.on('data', (chunk: Buffer) => {
			fileSize += chunk.length;
			if (fileSize > 1024) {
				const error = new BadRequestException('FileToBig');
				req.destroy();
				throw error;
			}
		});

		const jwt = JwtExtractor.extractJwtFromRequest(req);
		if (!jwt) {
			throw new Error();
		}

		await this.fileClient.uploadTempFile(
			jwt,
			currentUser.schoolId,
			StorageLocation.SCHOOL,
			currentUser.userId,
			FileRecordParentType.USERS,
			req
		);
	}
}
