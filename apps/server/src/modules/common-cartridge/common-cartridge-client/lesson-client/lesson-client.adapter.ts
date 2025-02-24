import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { JwtExtractor } from '@shared/common/utils';
import { RawAxiosRequestConfig } from 'axios';
import { Request } from 'express';
import { LessonDto, LessonLinkedTaskDto } from './dto';
import { LessonApi } from './lessons-api-client';
import { LessonDtoMapper } from './mapper/lesson-dto.mapper';

@Injectable()
export class LessonClientAdapter {
	constructor(private readonly lessonApi: LessonApi, @Inject(REQUEST) private request: Request) {}

	public async getLessonById(lessonId: string): Promise<LessonDto> {
		const options = this.createOptionParams();
		const response = await this.lessonApi.lessonControllerGetLesson(lessonId, options);
		const lessonDto = LessonDtoMapper.mapToLessonDto(response.data);
		lessonDto.linkedTasks = await this.getLessonTasks(lessonId);

		return lessonDto;
	}

	public async getLessonTasks(lessonId: string): Promise<LessonLinkedTaskDto[]> {
		const options = this.createOptionParams();
		const response = await this.lessonApi.lessonControllerGetLessonTasks(lessonId, options);

		const lessonTasksDtoList = response.data.map((task) => LessonDtoMapper.mapToLessonLinkedTaskDto(task));

		return lessonTasksDtoList;
	}

	private createOptionParams(): RawAxiosRequestConfig {
		const jwt = this.getJwt();
		const options: RawAxiosRequestConfig = { headers: { authorization: `Bearer ${jwt}` } };

		return options;
	}

	private getJwt(): string {
		return JwtExtractor.extractJwtFromRequestOrFail(this.request);
	}
}
