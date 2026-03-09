import { Injectable } from '@nestjs/common';
import { LessonApi, LessonLinkedTaskResponse, LessonResponse } from '../generated';
import { AdapterUtils } from './adapter.utils';

@Injectable()
export class LessonClientAdapter {
	constructor(private readonly lessonApi: LessonApi) {}

	public async getLessonById(jwt: string, lessonId: string): Promise<LessonResponse> {
		const response = await this.lessonApi.lessonControllerGetLesson(
			lessonId,
			AdapterUtils.createAxiosConfigForJwt(jwt)
		);

		return response.data;
	}

	public async getLessonTasks(jwt: string, lessonId: string): Promise<LessonLinkedTaskResponse[]> {
		const response = await this.lessonApi.lessonControllerGetLessonTasks(
			lessonId,
			AdapterUtils.createAxiosConfigForJwt(jwt)
		);

		return response.data;
	}
}
