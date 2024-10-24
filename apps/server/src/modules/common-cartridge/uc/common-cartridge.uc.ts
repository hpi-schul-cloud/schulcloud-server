import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { CourseFileIdsResponse } from '../controller/dto';
import { CommonCartridgeExportService } from '../service/common-cartridge-export.service';
import { CourseExportBodyResponse } from '../controller/dto/course-export-body.response';
import { CourseCommonCartridgeMetadataDto } from '../common-cartridge-client/course-client';
import { CardListResponseDto } from '../common-cartridge-client/card-client/dto/card-list-response.dto';

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

	public async exportCardList(cardIds: Array<string>): Promise<CardListResponseDto> {
		const lesson = await this.exportService.findAllCardsByIds(cardIds);

		return lesson;
	}
}
