import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Controller, Delete, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
	LessonLinkedTaskResponse,
	LessonMetadataListResponse,
	LessonResponse,
	LessonUrlParams,
	LessonsUrlParams,
} from './dto';
import { LessonMapper } from './mapper';
import { LessonUC } from './uc';

@ApiTags('Lesson')
@JwtAuthentication()
@Controller('lessons')
export class LessonController {
	constructor(private readonly lessonUC: LessonUC) {}

	@Delete(':lessonId')
	public async delete(@Param() urlParams: LessonUrlParams, @CurrentUser() currentUser: ICurrentUser): Promise<boolean> {
		const result = await this.lessonUC.delete(currentUser.userId, urlParams.lessonId);

		return result;
	}

	@Get('course/:courseId')
	public async getCourseLessons(
		@Param() urlParams: LessonsUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<LessonMetadataListResponse> {
		const lessons = await this.lessonUC.getLessons(currentUser.userId, urlParams.courseId);

		const dtoList = lessons.map((lesson) => LessonMapper.mapToMetadataResponse(lesson));
		const response = new LessonMetadataListResponse(dtoList, dtoList.length);
		return response;
	}

	@Get(':lessonId')
	public async getLesson(
		@Param() urlParams: LessonUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<LessonResponse> {
		const lesson = await this.lessonUC.getLesson(currentUser.userId, urlParams.lessonId);
		const response = new LessonResponse(lesson);
		return response;
	}

	@Get(':lessonId/tasks')
	public async getLessonTasks(
		@Param() urlParams: LessonUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<LessonLinkedTaskResponse[]> {
		const tasks = await this.lessonUC.getLessonLinkedTasks(currentUser.userId, urlParams.lessonId);

		return tasks;
	}
}
