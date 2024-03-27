import { AuthorizationContextBuilder } from '@modules/authorization';
import { AuthorizableReferenceType, AuthorizationReferenceService } from '@modules/authorization/domain';
import { CommonCartridgeVersion } from '@modules/common-cartridge';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { LearnroomConfig } from '../learnroom.config';
import { CommonCartridgeExportService } from '../service/common-cartridge-export.service';

@Injectable()
export class CourseExportUc {
	constructor(
		private readonly configService: ConfigService<LearnroomConfig, true>,
		private readonly courseExportService: CommonCartridgeExportService,
		private readonly authorizationService: AuthorizationReferenceService
	) {}

	public async exportCourse(
		courseId: EntityId,
		userId: EntityId,
		version: CommonCartridgeVersion,
		topics: string[],
		tasks: string[]
	): Promise<Buffer> {
		this.checkFeatureEnabled();
		const context = AuthorizationContextBuilder.read([Permission.COURSE_EDIT]);
		await this.authorizationService.checkPermissionByReferences(
			userId,
			AuthorizableReferenceType.Course,
			courseId,
			context
		);

		return this.courseExportService.exportCourse(courseId, userId, version, topics, tasks);
	}

	private checkFeatureEnabled(): void {
		if (!this.configService.get<boolean>('FEATURE_COMMON_CARTRIDGE_COURSE_EXPORT_ENABLED')) {
			throw new NotFoundException();
		}
	}
}
