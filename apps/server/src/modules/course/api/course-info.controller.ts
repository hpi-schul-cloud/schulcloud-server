import { ErrorResponse } from '@core/error/dto';
import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginationParams } from '@shared/controller/dto';
import { Page } from '@shared/domain/domainobject';
import { CourseInfoUc } from './course-info.uc';
import { CourseInfoDto, CourseInfoListResponse } from './dto';
import { CourseFilterParams } from './dto/course-filter.params';
import { CourseSortParams } from './dto/course-sort.params';
import { CourseInfoResponseMapper } from './mapper/course-info-response.mapper';

@ApiTags('Course Info')
@JwtAuthentication()
@Controller('course-info')
export class CourseInfoController {
	constructor(private readonly courseInfoUc: CourseInfoUc) {}

	@Get()
	@ApiOperation({ summary: 'Get course information.' })
	@ApiResponse({ status: HttpStatus.OK, type: CourseInfoListResponse })
	@ApiResponse({ status: '4XX', type: ErrorResponse })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	public async getCourseInfo(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() pagination: PaginationParams,
		@Query() sortingQuery: CourseSortParams,
		@Query() filterParams: CourseFilterParams
	): Promise<CourseInfoListResponse> {
		const courses: Page<CourseInfoDto> = await this.courseInfoUc.getCourseInfo(
			currentUser.userId,
			currentUser.schoolId,
			sortingQuery.sortBy,
			filterParams.status,
			filterParams.withoutTeachers,
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
