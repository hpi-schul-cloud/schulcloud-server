import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { CourseFileIdsResponse } from '../controller/dto';
import { CommonCartridgeExportService } from '../service/common-cartridge-export.service';
import { CourseCommonCartridgeMetadataDto } from '../common-cartridge-client/dto/course-common-cartridge-metadata.dto';

@Injectable()
export class CommonCartridgeUc {
	constructor(private readonly exportService: CommonCartridgeExportService) {}

	public async exportCourse(courseId: EntityId): Promise<CourseFileIdsResponse> {
		const files = await this.exportService.findCourseFileRecords(courseId);
		const response = new CourseFileIdsResponse(files.map((file) => file.id));

		return response;
	}

	public async getCourseCommonCartridgeMetadata(courseId: EntityId): Promise<CourseCommonCartridgeMetadataDto> {
		const courseMetadata = await this.exportService.findCourseCcMetadata(courseId);

		return courseMetadata;
	}
}
