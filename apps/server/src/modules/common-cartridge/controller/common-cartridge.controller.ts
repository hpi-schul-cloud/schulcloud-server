import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CommonCartridgeUc } from '../uc/common-cartridge.uc';
import { ExportCourseParams } from './dto';
import { CourseExportBodyResponse } from './dto/course-export-body.response';
import { CardListResponseDto } from '../common-cartridge-client/card-client/dto/card-list-response.dto';

@ApiTags('common-cartridge')
@Controller('common-cartridge')
export class CommonCartridgeController {
	constructor(private readonly commonCartridgeUC: CommonCartridgeUc) {}

	@Get('export/:parentId')
	public async exportCourse(@Param() exportCourseParams: ExportCourseParams): Promise<CourseExportBodyResponse> {
		return this.commonCartridgeUC.exportCourse(exportCourseParams.parentId);
	}

	@Get('export/cards/:parentId')
	public async exportCards(@Param() exportCourseParams: ExportCourseParams): Promise<CardListResponseDto> {
		const ids: Array<string> = new Array<string>(exportCourseParams.parentId);
		return this.commonCartridgeUC.exportCardList(ids);
	}
}
