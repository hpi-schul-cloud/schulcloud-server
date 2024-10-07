import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CommonCartridgeUc } from '../uc/common-cartridge.uc';
import { ExportCourseParams } from './dto';
import { CourseExportBodyResponse } from './dto/course-export-body.response';
import { RoomBoardDto } from '../common-cartridge-client/room-client/dto/room-board.dto';

@ApiTags('common-cartridge')
@Controller('common-cartridge')
export class CommonCartridgeController {
	constructor(private readonly commonCartridgeUC: CommonCartridgeUc) {}

	@Get('export/:parentId')
	public async exportCourse(@Param() exportCourseParams: ExportCourseParams): Promise<CourseExportBodyResponse> {
		return this.commonCartridgeUC.exportCourse(exportCourseParams.parentId);
	}

	@Get('export/:parentId/room')
	public async exportRoomBoard(@Param() exportCourseParams: ExportCourseParams): Promise<RoomBoardDto> {
		return this.commonCartridgeUC.exportRoomBoard(exportCourseParams.parentId);
	}
}
