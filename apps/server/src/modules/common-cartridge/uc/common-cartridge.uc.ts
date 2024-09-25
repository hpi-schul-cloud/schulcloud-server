import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { CourseFileIdsResponse } from '../controller/dto';
import { CommonCartridgeExportService } from '../service/common-cartridge-export.service';
import { CourseExportBodyResponse } from '../controller/dto/course-export-body.response';
import { CourseCommonCartridgeMetadataDto } from '../common-cartridge-client/course-client';
import { SingleColumnBoardResponse } from '../common-cartridge-client/room-client/room-api-client';

@Injectable()
export class CommonCartridgeUc {
	constructor(private readonly exportService: CommonCartridgeExportService) {}

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

	public async exportCourseRooms(courseId: EntityId): Promise<SingleColumnBoardResponse> {
		const response = await this.exportService.findCourseRooms(courseId);

		return response;
	}
}
