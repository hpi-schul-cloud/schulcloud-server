import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { CourseCommonCartridgeMetadataDto } from '../common-cartridge-client/course-client';
import { CourseFileIdsResponse } from '../controller/dto';
import { CourseExportBodyResponse } from '../controller/dto/course-export-body.response';
import { CommonCartridgeImportService } from '../service';
import { CommonCartridgeExportService } from '../service/common-cartridge-export.service';

@Injectable()
export class CommonCartridgeUc {
	constructor(
		private readonly exportService: CommonCartridgeExportService,
		private readonly importService: CommonCartridgeImportService
	) {}

	public async exportCourse(courseId: EntityId): Promise<CourseExportBodyResponse> {
		const files = await this.exportService.findCourseFileRecords(courseId);
		const courseFileIds = new CourseFileIdsResponse(files.map((file) => file.id));
		const courseCommonCartridgeMetadata: CourseCommonCartridgeMetadataDto =
			await this.exportService.findCourseCommonCartridgeMetadata(courseId);

		const response = new CourseExportBodyResponse({
			courseFileIds,
			courseCommonCartridgeMetadata,
		});

		return response;
	}

	public async importCourse(file: Express.Multer.File): Promise<void> {
		await this.importService.importCourse(file);
	}
}
