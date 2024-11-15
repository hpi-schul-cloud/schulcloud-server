import { Body, Controller, Param, Post, Query, Res, StreamableFile } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { CommonCartridgeUc } from '../uc/common-cartridge.uc';
import { ExportCourseParams } from './dto';
import { CourseQueryParams } from './dto/course.query.params';
import { CourseExportBodyParams } from './dto/course-export.body.params';

@ApiTags('common-cartridge')
@Controller('common-cartridge')
export class CommonCartridgeController {
	constructor(private readonly commonCartridgeUC: CommonCartridgeUc) {}

	@Post('export/:parentId')
	public async exportCourse(
		@Param() exportCourseParams: ExportCourseParams,
		@Query() queryParams: CourseQueryParams,
		@Body() bodyParams: CourseExportBodyParams,
		@Res({ passthrough: true }) response: Response
	): Promise<StreamableFile> {
		const result = await this.commonCartridgeUC.exportCourse(
			exportCourseParams.parentId,
			queryParams.version,
			bodyParams.topics,
			bodyParams.tasks,
			bodyParams.columnBoards
		);

		response.set({
			'Content-Type': 'application/zip',
			'Content-Disposition': `attachment; filename=course_${exportCourseParams.parentId}.zip`,
		});

		return new StreamableFile(result);
	}
}
