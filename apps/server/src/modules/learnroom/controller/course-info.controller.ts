import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginationParams } from '@shared/controller/';
import { Page } from '@shared/domain/domainobject';
import { ErrorResponse } from '@src/core/error/dto';
import { CourseInfoResponseMapper } from '../mapper/course-info-response.mapper';
import { CourseInfoDto } from '../uc/dto';
import { CourseFilterParams } from './dto/request/course-filter-params';
import { CourseSortParams } from './dto/request/course-sort-params';
import { CourseInfoListResponse } from './dto/response';
import { CourseInfoUc } from '../uc/course-info.uc';

@ApiTags('Course Info')
@JwtAuthentication()
@Controller('course-info')
export class CourseInfoController {
	constructor(private readonly courseInfoUc: CourseInfoUc) {}

	@Get()
	@ApiOperation({ summary: 'Get a list of courses for school.' })
	@ApiResponse({ status: HttpStatus.OK, type: CourseInfoListResponse })
	@ApiResponse({ status: '4XX', type: ErrorResponse })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	async getCoursesForSchool(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() pagination: PaginationParams,
		@Query() sortingQuery: CourseSortParams,
		@Query() filterParams: CourseFilterParams
	): Promise<CourseInfoListResponse> {
		const courses: Page<CourseInfoDto> = await this.courseInfoUc.getCourseInfo(
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
