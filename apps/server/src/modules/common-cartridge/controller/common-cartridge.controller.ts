import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import {
	Body,
	Controller,
	HttpStatus,
	Param,
	Post,
	Query,
	Req,
	Res,
	StreamableFile,
	UploadedFile,
	UseInterceptors,
} from '@nestjs/common';
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
import { RequestLoggingInterceptor } from '@shared/common/interceptor';
import { Request, Response } from 'express';
import { CommonCartridgeUc } from '../uc/common-cartridge.uc';
import { CommonCartridgeImportBodyParams, CourseExportBodyParams, CourseQueryParams, ExportCourseParams } from './dto';
import { CommonCartridgeFileValidatorPipe } from './utils';

@JwtAuthentication()
@ApiTags('common-cartridge')
@Controller('common-cartridge')
export class CommonCartridgeController {
	constructor(private readonly commonCartridgeUC: CommonCartridgeUc) {}

	@Post('export/:courseId')
	@UseInterceptors(RequestLoggingInterceptor)
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
		const disposition = `attachment;`;
		const streamableFile = new StreamableFile(result.data, {
			disposition: `${disposition}; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`,
		});

		return streamableFile;
	}

	@Post('import')
	@UseInterceptors(FileInterceptor('file'))
	@ApiOperation({ summary: 'Imports a course from a Common Cartridge file.' })
	@ApiConsumes('multipart/form-data')
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
		await this.commonCartridgeUC.importCourse(file.buffer, currentUser);
	}
}
