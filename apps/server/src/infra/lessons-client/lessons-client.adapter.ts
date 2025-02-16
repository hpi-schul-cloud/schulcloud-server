import { Injectable } from '@nestjs/common';
import { LessonApi } from './generated';
import type { LessonLinkedTaskResponse, LessonResponse } from './generated/models';

@Injectable()
export class LessonsClientAdapter {
	constructor(private readonly lessonsApi: LessonApi) {}

	public async getLessonById(id: string): Promise<LessonResponse> {
		const response = await this.lessonsApi.lessonControllerGetLesson(id);

		return response.data;
	}

	public async getLessonTasks(id: string): Promise<LessonLinkedTaskResponse[]> {
		const response = await this.lessonsApi.lessonControllerGetLessonTasks(id);

		return response.data;
	}
}
