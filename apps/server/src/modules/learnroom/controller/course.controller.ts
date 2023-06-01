import { Controller, Get, NotFoundException, Param, Query, Res, StreamableFile } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { PaginationParams } from '@shared/controller/';
import { ICurrentUser } from '@src/modules/authentication';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { CourseUc } from '../uc/course.uc';
import { CourseExportUc } from '../uc/course-export.uc';
import { CourseMetadataListResponse, CourseUrlParams, CourseQueryParams } from './dto';
import { CourseMapper } from '../mapper/course.mapper';

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
		if (!this.configService.get<boolean>('FEATURE_IMSCC_COURSE_EXPORT_ENABLED')) throw new NotFoundException();
		const result = await this.courseExportUc.exportCourse(urlParams.courseId, currentUser.userId, queryParams.version);
		response.set({
			'Content-Type': 'application/zip',
			'Content-Disposition': 'attachment;',
		});
		return new StreamableFile(result);
	}

	@Get(':courseId')
	async getCourse(@CurrentUser() currentUser: ICurrentUser, @Param() urlParams: CourseUrlParams) {
		const course = await this.courseUc.getCourse(currentUser.userId, urlParams.courseId);
		const response = CourseMapper.mapToCourseResponse(course);

		return response;
	}
}
