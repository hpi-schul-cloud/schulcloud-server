import { JwtAuthentication } from '@infra/auth-guard';
import { Body, Controller, HttpCode, HttpStatus, Param, Post, Query, Req, Res, StreamableFile } from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiBody,
	ApiConsumes,
	ApiInternalServerErrorResponse,
	ApiOkResponse,
	ApiOperation,
	ApiProduces,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { CommonCartridgeUc } from '../uc/common-cartridge.uc';
import { CourseExportBodyParams, CourseQueryParams, ExportCourseParams } from './dto';
import { CommonCartridgeStartImportBodyParams } from './dto/common-cartridge-start-import-body.params';

@JwtAuthentication()
@ApiTags('common-cartridge')
@Controller('common-cartridge')
export class CommonCartridgeController {
	constructor(private readonly commonCartridgeUC: CommonCartridgeUc) {}

	@Post('export/:courseId')
	public async exportCourse(
		@Param() exportCourseParams: ExportCourseParams,
		@Query() queryParams: CourseQueryParams,
		@Body() bodyParams: CourseExportBodyParams,
		@Req() req: Request,
		@Res({ passthrough: true }) response: Response
	): Promise<StreamableFile> {
		const result = await this.commonCartridgeUC.exportCourse(
			exportCourseParams.courseId,
			queryParams.version,
			bodyParams.topics,
			bodyParams.tasks,
			bodyParams.columnBoards
		);

		req.on('close', () => result.data.destroy());
		response.status(HttpStatus.OK);

		const encodedFileName = encodeURIComponent(result.name);
		const streamableFile = new StreamableFile(result.data, {
			disposition: `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`,
		});

		return streamableFile;
	}

	@Post('start-import')
	@ApiOperation({ summary: 'Start the import of a previously uploaded file.' })
	@ApiConsumes('application/json')
	@ApiProduces('application/json')
	@ApiBody({ type: CommonCartridgeStartImportBodyParams, required: true })
	@ApiOkResponse({ description: 'Import was started successfully.' })
	@ApiUnauthorizedResponse({ description: 'Request is unauthorized.' })
	@ApiBadRequestResponse({ description: 'Request data has invalid format.' })
	@ApiInternalServerErrorResponse({ description: 'Internal server error.' })
	@HttpCode(200)
	public importCourse(@Body() startImportParams: CommonCartridgeStartImportBodyParams): void {
		this.commonCartridgeUC.startCourseImport(startImportParams);
	}
}
