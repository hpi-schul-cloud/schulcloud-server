import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CommonCartridgeUc } from '../uc/common-cartridge.uc';
import { CourseFileIdsResponse, ExportCourseParams } from './dto';
import { CourseCommonCartridgeMetadataDto } from '../common-cartridge-client/dto/course-common-cartridge-metadata.dto';

@ApiTags('common-cartridge')
@Controller('common-cartridge')
export class CommonCartridgeController {
	constructor(private readonly commonCartridgeUC: CommonCartridgeUc) {}

	@Get('export/:parentId')
	public async exportCourse(@Param() exportCourseParams: ExportCourseParams): Promise<CourseFileIdsResponse> {
		return this.commonCartridgeUC.exportCourse(exportCourseParams.parentId);
	}

	@Get('course/:parentId')
	public async getCourseCommonCartridgeMetadata(
		@Param() exportCourseParams: ExportCourseParams
	): Promise<CourseCommonCartridgeMetadataDto> {
		return this.commonCartridgeUC.getCourseCommonCartridgeMetadata(exportCourseParams.parentId);
	}
}
