import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Controller, Get, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
	ApiBadRequestResponse,
	ApiBody,
	ApiConsumes,
	ApiCreatedResponse,
	ApiInternalServerErrorResponse,
	ApiOperation,
	ApiProduces,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
// TODO: move this into common-cartridge module
import { CommonCartridgeFileValidatorPipe } from '@src/modules/learnroom/utils';
import { CommonCartridgeUc } from '../uc/common-cartridge.uc';
import { CommonCartridgeImportBodyParams, ExportCourseParams } from './dto';
import { CourseExportBodyResponse } from './dto/course-export-body.response';

@JwtAuthentication()
@ApiTags('common-cartridge')
@Controller('common-cartridge')
export class CommonCartridgeController {
	constructor(private readonly commonCartridgeUC: CommonCartridgeUc) {}

	@Get('export/:parentId')
	public exportCourse(@Param() exportCourseParams: ExportCourseParams): Promise<CourseExportBodyResponse> {
		return this.commonCartridgeUC.exportCourse(exportCourseParams.parentId);
	}

	@Post('import')
	@UseInterceptors(FileInterceptor('file'))
	@ApiOperation({ summary: 'Imports a course from a Common Cartridge file.' })
	@ApiConsumes('application/octet-stream')
	@ApiProduces('application/json')
	@ApiBody({ type: CommonCartridgeImportBodyParams, required: true })
	@ApiCreatedResponse({ description: 'Course was successfully imported.' })
	@ApiUnauthorizedResponse({ description: 'Request is unauthorized.' })
	@ApiBadRequestResponse({ description: 'Request data has invalid format.' })
	@ApiInternalServerErrorResponse({ description: 'Internal server error.' })
	public async importCourse(
		@CurrentUser() currentUser: ICurrentUser,
		@UploadedFile(CommonCartridgeFileValidatorPipe)
		file: Express.Multer.File
	): Promise<void> {
		await this.commonCartridgeUC.importCourse(file.buffer);
	}
}
