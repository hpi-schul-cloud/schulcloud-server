import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { PaginationParams } from '@shared/controller/';
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
		@Query() pagination: PaginationParams
	): Promise<CourseMetadataListResponse> {
		const [courses, total] = await this.courseUc.findAllByUser(currentUser.userId, pagination);
		const courseResponses = courses.map((course) => CourseMapper.mapToMetadataResponse(course));
		const { skip, limit } = pagination;

		const result = new CourseMetadataListResponse(courseResponses, total, skip, limit);
		return result;
	}
}
