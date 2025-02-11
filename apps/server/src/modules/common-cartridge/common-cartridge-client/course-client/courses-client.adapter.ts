import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { extractJwtFromHeader } from '@shared/common';
import { RawAxiosRequestConfig } from 'axios';
import { Request } from 'express';
import { CourseCommonCartridgeMetadataDto } from './dto/course-common-cartridge-metadata.dto';
import { CoursesApi } from './course-api-client';

@Injectable()
export class CoursesClientAdapter {
	constructor(private readonly coursesApi: CoursesApi, @Inject(REQUEST) private request: Request) {}

	public async getCourseCommonCartridgeMetadata(courseId: string): Promise<CourseCommonCartridgeMetadataDto> {
		const options = this.createOptionParams();
		const response = await this.coursesApi.courseControllerGetCourseCcMetadataById(courseId, options);
		const courseCommonCartridgeMetadata: CourseCommonCartridgeMetadataDto = new CourseCommonCartridgeMetadataDto({
			id: response.data.id,
			courseName: response.data.title,
			creationDate: response.data.creationDate,
			copyRightOwners: response.data.copyRightOwners,
		});

		return courseCommonCartridgeMetadata;
	}

	private createOptionParams(): RawAxiosRequestConfig {
		const jwt = this.getJwt();
		const options: RawAxiosRequestConfig = { headers: { authorization: `Bearer ${jwt}` } };

		return options;
	}

	private getJwt(): string {
		const jwt = extractJwtFromHeader(this.request) || this.request.headers.authorization;

		if (!jwt) {
			throw new UnauthorizedException('Authentication is required.');
		}

		return jwt;
	}
}
