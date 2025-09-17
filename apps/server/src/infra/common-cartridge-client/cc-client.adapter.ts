import { Injectable } from '@nestjs/common';
import { CommonCartridgeApi, CreateCcCourseBodyParams } from './generated';

@Injectable()
export class CommonCartrideImportClientAdapter {
	constructor(private readonly importApi: CommonCartridgeApi) {}

	public async importFile(createCcCourseBodyParams: CreateCcCourseBodyParams): Promise<void> {
		await this.importApi.commonCartridgeImportControllerImportFile(createCcCourseBodyParams);
	}
}
