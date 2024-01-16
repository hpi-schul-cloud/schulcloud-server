import { Authenticate, CurrentUser, ICurrentUser } from '@modules/authentication';
import {
	Controller,
	Get,
	HttpStatus,
	NotFoundException,
	Param,
	ParseFilePipeBuilder,
	Post,
	Query,
	Req,
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
		if (!this.configService.get<boolean>('FEATURE_IMSCC_COURSE_EXPORT_ENABLED')) throw new NotFoundException();
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
		@UploadedFile(
			new ParseFilePipeBuilder()
				.addMaxSizeValidator({ maxSize: 1000 * 1000 * 1000 * 2 }) // 2GB
				// .addFileTypeValidator({ fileType: '.imscc' })
				.build({ fileIsRequired: true, errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY })
		)
		file: Express.Multer.File,
		@CurrentUser() currentUser: ICurrentUser,
		@Req() request: Request
	): Promise<void> {
		console.log(file);
		console.log(request);
		await this.courseImportUc.importFromCommonCartridge(currentUser.userId, file.buffer);
	}
}
