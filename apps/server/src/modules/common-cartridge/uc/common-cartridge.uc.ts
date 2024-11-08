import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { CourseCommonCartridgeMetadataDto } from '../common-cartridge-client/course-client';
import { CourseFileIdsResponse } from '../controller/dto';
import { CourseExportBodyResponse } from '../controller/dto/course-export-body.response';
import { CommonCartridgeExportService } from '../service/common-cartridge-export.service';

@Injectable()
export class CommonCartridgeUc {
	constructor(private readonly exportService: CommonCartridgeExportService) {}

	public async exportCourse(courseId: EntityId): Promise<CourseExportBodyResponse> {
		const fileRecords = await this.exportService.findCourseFileRecords(courseId);
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const files = await this.exportService.getFiles(fileRecords);
		const courseFileIds = new CourseFileIdsResponse(fileRecords.map((file) => file.id));
		const courseCommonCartridgeMetadata: CourseCommonCartridgeMetadataDto =
			await this.exportService.findCourseCommonCartridgeMetadata(courseId);

		const response = new CourseExportBodyResponse({
			courseFileIds,
			courseCommonCartridgeMetadata,
		});

		return response;
	}
}
