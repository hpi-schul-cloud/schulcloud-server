import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { FileRecordResponse } from '@infra/common-cartridge-clients';
import { Body, Controller, HttpCode, HttpStatus, Param, Post, Query, Req, Res, StreamableFile } from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiBody,
	ApiConsumes,
	ApiInternalServerErrorResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { CommonCartridgeUc } from '../uc/common-cartridge.uc';
import { CourseExportBodyParams, CourseQueryParams, ExportCourseParams } from './dto';
import { CommonCartridgeFileParams } from './dto/common-cartridge-file.params';

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

	@Post('import')
	@ApiOperation({ summary: 'Upload a file and start the asynchronous import.' })
	@ApiOkResponse({ description: 'Import was started successfully.' })
	@ApiUnauthorizedResponse({ description: 'Request is unauthorized.' })
	@ApiBadRequestResponse({ description: 'Request data has invalid format.' })
	@ApiInternalServerErrorResponse({ description: 'Internal server error.' })
	@ApiConsumes('application/octet-stream')
	@ApiBody({ schema: { type: 'string', format: 'binary' }, required: true })
	@HttpCode(200)
	public async uploadFileAndStartImport(
		@CurrentUser() currentUser: ICurrentUser,
		_?: CommonCartridgeFileParams
	): Promise<FileRecordResponse> {
		const fileRecordResponse = await this.commonCartridgeUC.uploadFileFromRequestToTemp(currentUser);

		this.commonCartridgeUC.startCourseImport({
			fileRecordId: fileRecordResponse.id,
			fileUrl: fileRecordResponse.url,
			fileName: fileRecordResponse.name,
		});

		return fileRecordResponse;
	}
}
