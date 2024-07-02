import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { CourseFileIdsResponse } from '../controller/dto';
import { CommonCartridgeExportService } from '../service/common-cartridge-export.service';

@Injectable()
export class CommonCartridgeUc {
	constructor(private readonly exportService: CommonCartridgeExportService) {}

	public async exportCourse(courseId: EntityId): Promise<CourseFileIdsResponse> {
		const records = await this.exportService.findCourseFileRecords(courseId);
		const response = new CourseFileIdsResponse(records.map((record) => record.id));

		return response;
	}
}
