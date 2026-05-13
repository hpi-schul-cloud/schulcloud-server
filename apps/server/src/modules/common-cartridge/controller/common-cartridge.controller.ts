import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import {
	BadRequestException,
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Param,
	Post,
	Query,
	Req,
	Res,
	StreamableFile,
	UseInterceptors,
} from '@nestjs/common';
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
import { FileRecordResponse } from '@infra/common-cartridge-clients';

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

	@Post('upload')
	public async uploadFile(@CurrentUser() currentUser: ICurrentUser, @Req() req: Request): Promise<FileRecordResponse> {
		// Extract filename from Content-Disposition header or use a default
		const contentDisposition = req.headers['content-disposition'] as string | undefined;
		let fileName = 'upload.imscc';
		if (contentDisposition) {
			const filenameMatch = contentDisposition.match(/filename[*]?=['"]?(?:UTF-8'')?([^;'"\n]+)['"]?/i);
			if (filenameMatch?.[1]) {
				fileName = decodeURIComponent(filenameMatch[1]);
			}
		}

		const fileRecordResponse = await this.commonCartridgeUC.uploadFileToTemp(currentUser, req, fileName);

		return fileRecordResponse;
	}
}
