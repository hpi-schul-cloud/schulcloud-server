import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Post,
	Query,
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
	ApiNoContentResponse,
	ApiOperation,
	ApiResponse,
	ApiTags,
	ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { PaginationParams } from '@shared/controller/';
import { Page } from '@shared/domain/domainobject';
import { ErrorResponse } from '@src/core/error/dto';
import { Response } from 'express';
import { CourseInfoResponseMapper } from '../mapper/course-info-response.mapper';
import { CourseMapper } from '../mapper/course.mapper';
import { CourseExportUc, CourseImportUc, CourseSyncUc, CourseUc } from '../uc';
import { CourseInfoDto } from '../uc/dto';
import { CommonCartridgeFileValidatorPipe } from '../utils';
import {
	CourseExportBodyParams,
	CourseImportBodyParams,
	CourseMetadataListResponse,
	CourseQueryParams,
	CourseSyncBodyParams,
	CourseUrlParams,
} from './dto';
import { CourseCommonCartridgeMetadataResponse } from './dto/course-cc-metadata.response';
import { CourseFilterParams } from './dto/request/course-filter-params';
import { CourseSortParams } from './dto/request/course-sort-params';
import { CourseInfoListResponse } from './dto/response';

@ApiTags('Courses')
@JwtAuthentication()
@Controller('courses')
export class CourseController {
	constructor(
		private readonly courseUc: CourseUc,
		private readonly courseExportUc: CourseExportUc,
		private readonly courseImportUc: CourseImportUc,
		private readonly courseSyncUc: CourseSyncUc
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

	@Post(':courseId/export')
	async exportCourse(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() urlParams: CourseUrlParams,
		@Query() queryParams: CourseQueryParams,
		@Body() bodyParams: CourseExportBodyParams,
		@Res({ passthrough: true }) response: Response
	): Promise<StreamableFile> {
		const result = await this.courseExportUc.exportCourse(
			urlParams.courseId,
			currentUser.userId,
			queryParams.version,
			bodyParams.topics,
			bodyParams.tasks,
			bodyParams.columnBoards
		);

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

	@Post(':courseId/stop-sync')
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Stop the synchronization of a course with a group.' })
	@ApiNoContentResponse({ description: 'The course was successfully disconnected from a group.' })
	@ApiUnprocessableEntityResponse({ description: 'The course is not synchronized with a group.' })
	public async stopSynchronization(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: CourseUrlParams
	): Promise<void> {
		await this.courseSyncUc.stopSynchronization(currentUser.userId, params.courseId);
	}

	@Post(':courseId/start-sync/')
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Start the synchronization of a course with a group.' })
	@ApiNoContentResponse({ description: 'The course was successfully connected to a group.' })
	public async startSynchronization(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: CourseUrlParams,
		@Body() bodyParams: CourseSyncBodyParams
	): Promise<void> {
		await this.courseSyncUc.startSynchronization(currentUser.userId, params.courseId, bodyParams.groupId);
	}

	@Get(':courseId/user-permissions')
	@ApiOperation({ summary: 'Get permissions for a user in a course.' })
	@ApiBadRequestResponse({ description: 'Request data has invalid format.' })
	@ApiInternalServerErrorResponse({ description: 'Internal server error.' })
	@ApiUnprocessableEntityResponse({ description: 'Unsupported role.' })
	@ApiCreatedResponse({
		status: 200,
		schema: { type: 'object', example: { userId: ['permission1', 'permission2'] } },
	})
	public async getUserPermissions(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: CourseUrlParams
	): Promise<{ [userId: string]: string[] }> {
		const permissions = await this.courseUc.getUserPermissionByCourseId(currentUser.userId, params.courseId);

		return {
			[currentUser.userId]: permissions,
		};
	}

	@Get(':courseId/cc-metadata')
	@ApiOperation({ summary: 'Get common cartridge metadata of a course by Id.' })
	@ApiBadRequestResponse({ description: 'Request data has invalid format.' })
	@ApiInternalServerErrorResponse({ description: 'Internal server error.' })
	public async getCourseCcMetadataById(
		@Param() param: CourseUrlParams
	): Promise<CourseCommonCartridgeMetadataResponse> {
		const course = await this.courseUc.findCourseById(param.courseId);

		return CourseMapper.mapToCommonCartridgeMetadataResponse(course);
	}

	@Get('/all')
	@ApiOperation({ summary: 'Get a list of all courses.' })
	@ApiResponse({ status: HttpStatus.OK, type: CourseInfoListResponse })
	@ApiResponse({ status: '4XX', type: ErrorResponse })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	async getAllCourses(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() pagination: PaginationParams,
		@Query() sortingQuery: CourseSortParams,
		@Query() filterParams: CourseFilterParams
	): Promise<CourseInfoListResponse> {
		const courses: Page<CourseInfoDto> = await this.courseUc.findAllCourses(
			currentUser.userId,
			currentUser.schoolId,
			sortingQuery.sortBy,
			filterParams.type,
			pagination,
			sortingQuery.sortOrder
		);

		const response: CourseInfoListResponse = CourseInfoResponseMapper.mapToCourseInfoListResponse(
			courses,
			pagination.skip,
			pagination.limit
		);

		return response;
	}
}
