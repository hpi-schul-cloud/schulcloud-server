import { Injectable } from '@nestjs/common';
import { CommonCartridgeApi, CreateCcCourseBodyParams } from './generated';

@Injectable()
export class CommonCartrideImportClientAdapter {
	constructor(private readonly importApi: CommonCartridgeApi) {}

	public async importCourse(createCcCourseBodyParams: CreateCcCourseBodyParams): Promise<void> {
		await this.importApi.commonCartridgeImportControllerImportCourse(createCcCourseBodyParams);
	}
}
