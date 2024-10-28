import { Controller, Get, Param, ParseArrayPipe, Query } from '@nestjs/common';
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

	@Get('export/cards')
	public async exportCards(
		@Query('ids', new ParseArrayPipe({ items: String, separator: ',' })) ids: string[]
	): Promise<CardListResponseDto> {
		const response: CardListResponseDto = await this.commonCartridgeUC.exportCardList(ids);
		return response;
	}
}
