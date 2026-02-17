import { Injectable } from '@nestjs/common';
import { RawAxiosRequestConfig } from 'axios';
import {
	CourseCommonCartridgeMetadataResponse,
	CoursesApi,
	CreateCourseBodyParams,
	CreateCourseResponse,
} from './generated';

@Injectable()
export class CoursesClientAdapter {
	constructor(private readonly coursesApi: CoursesApi) {}

	public async getCourseCommonCartridgeMetadata(
		jwt: string,
		courseId: string
	): Promise<CourseCommonCartridgeMetadataResponse> {
		const response = await this.coursesApi.courseControllerGetCourseCcMetadataById(courseId, this.getAxiosConfig(jwt));

		return response.data;
	}

	public async createCourse(jwt: string, params: CreateCourseBodyParams): Promise<CreateCourseResponse> {
		const response = await this.coursesApi.courseControllerCreateCourse(params, this.getAxiosConfig(jwt));

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
