import { Injectable } from '@nestjs/common';
import { RawAxiosRequestConfig } from 'axios';
import { LessonApi, LessonLinkedTaskResponse, LessonResponse } from '../generated';

@Injectable()
export class LessonClientAdapter {
	constructor(private readonly lessonApi: LessonApi) {}

	public async getLessonById(jwt: string, lessonId: string): Promise<LessonResponse> {
		const response = await this.lessonApi.lessonControllerGetLesson(lessonId, this.getAxiosConfig(jwt));

		return response.data;
	}

	public async getLessonTasks(jwt: string, lessonId: string): Promise<LessonLinkedTaskResponse[]> {
		const response = await this.lessonApi.lessonControllerGetLessonTasks(lessonId, this.getAxiosConfig(jwt));

		return response.data;
	}

	private getAxiosConfig(jwt: string): RawAxiosRequestConfig {
		return {
			headers: {
				Authorization: `Bearer ${jwt}`,
			},
		};
	}
}
