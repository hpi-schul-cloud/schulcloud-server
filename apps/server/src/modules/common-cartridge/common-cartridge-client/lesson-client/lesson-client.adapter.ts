import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { extractJwtFromHeader } from '@shared/common/utils';
import { RawAxiosRequestConfig } from 'axios';
import { Request } from 'express';
import { LessonDto, LessonLinkedTaskDto } from './dto';
import { LessonApi } from './lessons-api-client';
import { LessonDtoMapper } from './mapper/lesson-dto.mapper';

@Injectable()
export class LessonClientAdapter {
	constructor(
		private readonly lessonApi: LessonApi,
		@Inject(REQUEST) private request: Request,
	) {}

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
		const jwt = extractJwtFromHeader(this.request) ?? this.request.headers.authorization;

		if (!jwt) {
			throw new UnauthorizedException('No JWT found in request');
		}

		return jwt;
	}
}
