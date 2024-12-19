import { Injectable } from '@nestjs/common';
import { CourseCommonCartridgeMetadataResponse, CoursesApi, CreateCourseBodyParams } from './generated';

@Injectable()
export class CoursesClientAdapter {
	constructor(private readonly coursesApi: CoursesApi) {}

	public async getCourseCommonCartridgeMetadata(courseId: string): Promise<CourseCommonCartridgeMetadataResponse> {
		const response = await this.coursesApi.courseControllerGetCourseCcMetadataById(courseId);

		return response.data;
	}

	public async createCourse(params: CreateCourseBodyParams): Promise<void> {
		await this.coursesApi.courseControllerCreateCourse(params);
	}
}
