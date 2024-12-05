import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
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
		const courseCommonCartridgeMetadata = await this.exportService.findCourseCommonCartridgeMetadata(courseId);

		const response = new CourseExportBodyResponse({
			courseFileIds,
			courseCommonCartridgeMetadata,
		});

		return response;
	}

	public async importCourse(file: Buffer): Promise<void> {
		await this.importService.importFile(file);
	}
}
