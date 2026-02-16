import { Injectable } from '@nestjs/common';
import { InternalCoursesClientConfig } from './courses-client.config';
import {
	Configuration,
	CourseCommonCartridgeMetadataResponse,
	CoursesApi,
	CreateCourseBodyParams,
	CreateCourseResponse,
} from './generated';

@Injectable()
export class CoursesClientAdapter {
	constructor(private readonly config: InternalCoursesClientConfig) {}

	public async getCourseCommonCartridgeMetadata(
		jwt: string,
		courseId: string
	): Promise<CourseCommonCartridgeMetadataResponse> {
		const response = await this.coursesApi(jwt).courseControllerGetCourseCcMetadataById(courseId);

		return response.data;
	}

	public async createCourse(jwt: string, params: CreateCourseBodyParams): Promise<CreateCourseResponse> {
		const response = await this.coursesApi(jwt).courseControllerCreateCourse(params);

		return response.data;
	}

	private coursesApi(jwt: string): CoursesApi {
		const { basePath } = this.config;
		const configuration = new Configuration({
			basePath: `${basePath}/v3`,
			accessToken: jwt,
		});

		return new CoursesApi(configuration);
	}
}
