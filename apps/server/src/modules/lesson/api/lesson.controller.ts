import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Controller, Delete, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LessonLinkedTaskResponse, LessonResponse, LessonUrlParams } from './dto';
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
