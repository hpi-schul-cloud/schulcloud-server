import { Authenticate, CurrentUser, ICurrentUser } from '@modules/authentication';
import {
	Controller,
	Get,
	Param,
	Post,
	Query,
	Res,
	StreamableFile,
	UploadedFile,
	UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import {
	ApiBadRequestResponse,
	ApiBody,
	ApiConsumes,
	ApiCreatedResponse,
	ApiInternalServerErrorResponse,
	ApiOperation,
	ApiTags,
} from '@nestjs/swagger';
import { PaginationParams } from '@shared/controller/';
import { Response } from 'express';
import { CourseMapper } from '../mapper/course.mapper';
import { CourseImportUc } from '../uc';
import { CourseExportUc } from '../uc/course-export.uc';
import { CourseUc } from '../uc/course.uc';
import { CommonCartridgeFileValidatorPipe } from '../utils';
import { CourseImportBodyParams, CourseMetadataListResponse, CourseQueryParams, CourseUrlParams } from './dto';

@ApiTags('Courses')
@Authenticate('jwt')
@Controller('courses')
export class CourseController {
	constructor(
		private readonly courseUc: CourseUc,
		private readonly courseExportUc: CourseExportUc,
		private readonly courseImportUc: CourseImportUc,
		private readonly configService: ConfigService
	) {}

	@Get()
	async findForUser(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() pagination: PaginationParams
	): Promise<CourseMetadataListResponse> {
		const [courses, total] = await this.courseUc.findAllByUser(currentUser.userId, pagination);
		const courseResponses = courses.map((course) => CourseMapper.mapToMetadataResponse(course));
		const { skip, limit } = pagination;

		const result = new CourseMetadataListResponse(courseResponses, total, skip, limit);
		return result;
	}

	@Get(':courseId/export')
	async exportCourse(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() urlParams: CourseUrlParams,
		@Query() queryParams: CourseQueryParams,
		@Res({ passthrough: true }) response: Response
	): Promise<StreamableFile> {
		const result = await this.courseExportUc.exportCourse(urlParams.courseId, currentUser.userId, queryParams.version);

		response.set({
			'Content-Type': 'application/zip',
			'Content-Disposition': 'attachment;',
		});

		return new StreamableFile(result);
	}

	@Post('import')
	@UseInterceptors(FileInterceptor('file'))
	@ApiOperation({ summary: 'Imports a course from a Common Cartridge file.' })
	@ApiConsumes('multipart/form-data')
	@ApiBody({ type: CourseImportBodyParams, required: true })
	@ApiCreatedResponse({ description: 'Course was successfully imported.' })
	@ApiBadRequestResponse({ description: 'Request data has invalid format.' })
	@ApiInternalServerErrorResponse({ description: 'Internal server error.' })
	public async importCourse(
		@CurrentUser() currentUser: ICurrentUser,
		@UploadedFile(CommonCartridgeFileValidatorPipe)
		file: Express.Multer.File
	): Promise<void> {
		await this.courseImportUc.importFromCommonCartridge(currentUser.userId, file.buffer);
	}
}
