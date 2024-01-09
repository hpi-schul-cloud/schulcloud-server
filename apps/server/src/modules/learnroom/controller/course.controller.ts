import { Authenticate, CurrentUser, ICurrentUser } from '@modules/authentication';
import { Controller, Get, Param, Query, Res, StreamableFile } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { PaginationParams } from '@shared/controller/';
import { Response } from 'express';
import { CourseMapper } from '../mapper/course.mapper';
import { CourseExportUc } from '../uc/course-export.uc';
import { CourseUc } from '../uc/course.uc';
import { CourseMetadataListResponse, CourseQueryParams, CourseUrlParams } from './dto';

@ApiTags('Courses')
@Authenticate('jwt')
@Controller('courses')
export class CourseController {
	constructor(
		private readonly courseUc: CourseUc,
		private readonly courseExportUc: CourseExportUc,
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
		const result = await this.courseExportUc.exportCourse(
			urlParams.courseId,
			currentUser.userId,
			queryParams.version
		);

		response.set({
			'Content-Type': 'application/zip',
			'Content-Disposition': 'attachment;',
		});

		return new StreamableFile(result);
	}
}
