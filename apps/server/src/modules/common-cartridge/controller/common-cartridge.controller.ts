import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CommonCartridgeUc } from '../uc/common-cartridge.uc';
import { ExportCourseParams } from './dto';
import { CourseExportBodyResponse } from './dto/course-export-body.response';
import { SingleColumnBoardResponse } from '../common-cartridge-client/room-client/room-api-client';

@ApiTags('common-cartridge')
@Controller('common-cartridge')
export class CommonCartridgeController {
	constructor(private readonly commonCartridgeUC: CommonCartridgeUc) {}

	@Get('export/:parentId')
	public async exportCourse(@Param() exportCourseParams: ExportCourseParams): Promise<CourseExportBodyResponse> {
		return this.commonCartridgeUC.exportCourse(exportCourseParams.parentId);
	}

	@Get('export/:parentId/room')
	public async exportCourseRooms(@Param() exportCourseParams: ExportCourseParams): Promise<SingleColumnBoardResponse> {
		return this.commonCartridgeUC.exportCourseRooms(exportCourseParams.parentId);
	}
}
