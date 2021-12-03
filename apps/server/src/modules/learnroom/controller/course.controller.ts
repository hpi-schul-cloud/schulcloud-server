import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { PaginationQuery } from '@shared/controller/';
import { ICurrentUser } from '@shared/domain';
import { CourseUc } from '../uc/course.uc';
import { CourseMetadataListResponse } from './dto';
import { CourseMapper } from '../mapper/course.mapper';

@ApiTags('Courses')
@Authenticate('jwt')
@Controller('courses')
export class CourseController {
	constructor(private readonly courseUc: CourseUc) {}

	@Get()
	async findForUser(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() paginationQuery: PaginationQuery
	): Promise<CourseMetadataListResponse> {
		const [courses, total] = await this.courseUc.findActiveByUser(currentUser.userId, paginationQuery);
		const courseResponses = courses.map((course) => CourseMapper.mapToMetadataResponse(course));
		const { skip, limit } = paginationQuery;

		const result = new CourseMetadataListResponse(courseResponses, total, skip, limit);
		return result;
	}
}
