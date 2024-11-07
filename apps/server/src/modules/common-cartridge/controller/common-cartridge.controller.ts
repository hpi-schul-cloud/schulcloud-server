import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CommonCartridgeUc } from '../uc/common-cartridge.uc';
import { ExportCourseParams } from './dto';
import { CourseExportBodyResponse } from './dto/course-export-body.response';
import { ExportedCourse } from '../dto/exported-course.dto';

@ApiTags('common-cartridge')
@Controller('common-cartridge')
export class CommonCartridgeController {
	constructor(private readonly commonCartridgeUC: CommonCartridgeUc) {}

	@Get('export/:parentId')
	public async exportCourse(@Param() exportCourseParams: ExportCourseParams): Promise<CourseExportBodyResponse> {
		return this.commonCartridgeUC.exportCourse(exportCourseParams.parentId);
	}

	@Get('testexport/:parentId')
	public async exportCourseToCommonCartridge(@Param() exportCourseParams: ExportCourseParams): Promise<ExportedCourse> {
		return this.commonCartridgeUC.exportCourseToCommonCartridge(exportCourseParams.parentId);
	}
}
