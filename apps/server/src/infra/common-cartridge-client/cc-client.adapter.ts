import { Injectable } from '@nestjs/common';
import { CreateCcCourseBodyParams, ImportCommonCartridgeApi } from './generated';

@Injectable()
export class CommonCartrideImportClientAdapter {
	constructor(private readonly importApi: ImportCommonCartridgeApi) {}

	public async importFile(createCcCourseBodyParams: CreateCcCourseBodyParams): Promise<void> {
		await this.importApi.commonCartridgeImportControllerImportFile(createCcCourseBodyParams);
	}
}
