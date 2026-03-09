import { Injectable } from '@nestjs/common';
import {
	CourseCommonCartridgeMetadataResponse,
	CoursesApi,
	CreateCourseBodyParams,
	CreateCourseResponse,
} from '../generated';
import { AdapterUtils } from './adapter.utils';

@Injectable()
export class CoursesClientAdapter {
	constructor(private readonly coursesApi: CoursesApi) {}

	public async getCourseCommonCartridgeMetadata(
		jwt: string,
		courseId: string
	): Promise<CourseCommonCartridgeMetadataResponse> {
		const response = await this.coursesApi.courseControllerGetCourseCcMetadataById(
			courseId,
			AdapterUtils.createAxiosConfigForJwt(jwt)
		);

		return response.data;
	}

	public async createCourse(jwt: string, params: CreateCourseBodyParams): Promise<CreateCourseResponse> {
		const response = await this.coursesApi.courseControllerCreateCourse(
			params,
			AdapterUtils.createAxiosConfigForJwt(jwt)
		);

		return response.data;
	}
}
