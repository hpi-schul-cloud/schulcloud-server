import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiConsumes,
	ApiCreatedResponse,
	ApiInternalServerErrorResponse,
	ApiNoContentResponse,
	ApiOperation,
	ApiProduces,
	ApiTags,
	ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { PaginationParams } from '@shared/controller/dto';
import { CourseSyncUc } from './course-sync.uc';
import { CourseUc } from './course.uc';
import {
	CourseCommonCartridgeMetadataResponse,
	CourseMetadataListResponse,
	CourseSyncBodyParams,
	CourseUrlParams,
	CreateCourseBodyParams,
	CreateCourseResponse,
} from './dto';
import { CourseMapper } from './mapper';
import { CreateCourseDto } from './dto/create-course.dto';

@ApiTags('Courses')
@JwtAuthentication()
@Controller('courses')
export class CourseController {
	constructor(private readonly courseUc: CourseUc, private readonly courseSyncUc: CourseSyncUc) {}

	@Get()
	public async findForUser(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() pagination: PaginationParams
	): Promise<CourseMetadataListResponse> {
		const [courses, total] = await this.courseUc.findAllByUser(currentUser.userId, currentUser.schoolId, pagination);
		const courseResponses = courses.map((course) => CourseMapper.mapToMetadataResponse(course));
		const { skip, limit } = pagination;

		const result = new CourseMetadataListResponse(courseResponses, total, skip, limit);
		return result;
	}

	@Post()
	@ApiOperation({ summary: 'Create a new course.' })
	@ApiConsumes('application/json')
	@ApiProduces('application/json')
	@ApiCreatedResponse({ description: 'Course was successfully created.', type: CreateCourseResponse })
	@ApiBadRequestResponse({ description: 'Request data has invalid format.' })
	@ApiInternalServerErrorResponse({ description: 'Internal server error.' })
	public async createCourse(
		@CurrentUser() user: ICurrentUser,
		@Body() body: CreateCourseBodyParams
	): Promise<CreateCourseResponse> {
		const course = await this.courseUc.createCourse(user, new CreateCourseDto(body));
		const response = CourseMapper.mapToCreateCourseResponse(course);

		return response;
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
	@ApiNoContentResponse({ description: 'The course was successfully synchronized to a group.' })
	@ApiUnprocessableEntityResponse({ description: 'The course is already synchronized with a group.' })
	@ApiBadRequestResponse({ description: 'Request data has invalid format.' })
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
}
