import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CommonCartridgeUc } from '../uc/common-cartridge.uc';
import { ExportCourseParams } from './dto';
import { CourseExportBodyResponse } from './dto/course-export-body.response';
import { LessonDto, LessonLinkedTaskDto } from '../common-cartridge-client/lesson-client/dto';

@ApiTags('common-cartridge')
@Controller('common-cartridge')
export class CommonCartridgeController {
	constructor(private readonly commonCartridgeUC: CommonCartridgeUc) {}

	@Get('export/:parentId')
	public async exportCourse(@Param() exportCourseParams: ExportCourseParams): Promise<CourseExportBodyResponse> {
		return this.commonCartridgeUC.exportCourse(exportCourseParams.parentId);
	}

	@Get('export/lesson/:parentId')
	public async exportLesson(@Param() exportCourseParams: ExportCourseParams): Promise<LessonDto> {
		return this.commonCartridgeUC.exportLesson(exportCourseParams.parentId);
	}

	@Get('export/lessontasks/:parentId')
	public async exportLessonTasks(@Param() exportCourseParams: ExportCourseParams): Promise<LessonLinkedTaskDto[]> {
		return this.commonCartridgeUC.exportLessonTasks(exportCourseParams.parentId);
	}
}
