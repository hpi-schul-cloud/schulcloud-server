import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginationParams } from '@shared/controller/';
import { Page } from '@shared/domain/domainobject';
import { ErrorResponse } from '@src/core/error/dto';
import { CourseResponseMapper } from '../mapper/course-response.mapper';
import { CourseUc } from '../uc';
import { CourseInfoDto } from '../uc/dto';
import { CourseFilterParams } from './dto/request/course-filter-params';
import { CourseSortParams } from './dto/request/course-sort-params';
import { CourseListResponse } from './dto/response';

@ApiTags('Course Info')
@JwtAuthentication()
@Controller('course-info')
export class CourseController {
	constructor(private readonly courseUc: CourseUc) {}

	@Get()
	@ApiOperation({ summary: 'Get a list of courses for school.' })
	@ApiResponse({ status: HttpStatus.OK, type: CourseListResponse })
	@ApiResponse({ status: '4XX', type: ErrorResponse })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	async getCoursesForSchool(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() pagination: PaginationParams,
		@Query() sortingQuery: CourseSortParams,
		@Query() filterParams: CourseFilterParams
	): Promise<CourseListResponse> {
		const courses: Page<CourseInfoDto> = await this.courseUc.findAllCourses(
			currentUser.userId,
			currentUser.schoolId,
			sortingQuery.sortBy,
			filterParams.type,
			pagination,
			sortingQuery.sortOrder
		);

		const response: CourseListResponse = CourseResponseMapper.mapToCourseInfoListResponse(
			courses,
			pagination.skip,
			pagination.limit
		);

		return response;
	}
}
