import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Controller, Delete, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LessonUC } from '../uc';
import { LessonMetadataListResponse, LessonResponse, LessonUrlParams, LessonsUrlParams } from './dto';
import { SlimTaskResponse } from './dto/task.response';
import { LessonMapper } from './mapper/lesson.mapper';

@ApiTags('Lesson')
@JwtAuthentication()
@Controller('lessons')
export class LessonController {
	constructor(private readonly lessonUC: LessonUC) {}

	@Delete(':lessonId')
	async delete(@Param() urlParams: LessonUrlParams, @CurrentUser() currentUser: ICurrentUser): Promise<boolean> {
		const result = await this.lessonUC.delete(currentUser.userId, urlParams.lessonId);

		return result;
	}

	@Get('course/:courseId')
	async getCourseLessons(@Param() urlParams: LessonsUrlParams, @CurrentUser() currentUser: ICurrentUser) {
		const lessons = await this.lessonUC.getLessons(currentUser.userId, urlParams.courseId);

		const dtoList = lessons.map((lesson) => LessonMapper.mapToMetadataResponse(lesson));
		const response = new LessonMetadataListResponse(dtoList, dtoList.length);
		return response;
	}

	@Get(':lessonId')
	async getLesson(@Param() urlParams: LessonUrlParams, @CurrentUser() currentUser: ICurrentUser) {
		const lesson = await this.lessonUC.getLesson(currentUser.userId, urlParams.lessonId);
		const response = new LessonResponse(lesson);
		return response;
	}

	@Get(':lessonId/tasks')
	async getLessonTasks(
		@Param() urlParams: LessonUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<SlimTaskResponse[]> {
		const tasks = await this.lessonUC.getTasks(currentUser.userId, urlParams.lessonId);

		return tasks;
	}
}
