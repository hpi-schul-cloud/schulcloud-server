import { Injectable } from '@nestjs/common';
import { CreateCcCourseBodyParams, ImportCommonCartridgeApi } from './generated';
import { LegacyLogger } from '@core/logger';

@Injectable()
export class CommonCartridgeImportClientAdapter {
	constructor(private readonly importApi: ImportCommonCartridgeApi, private readonly logger: LegacyLogger) {}

	public async importFile(createCcCourseBodyParams: CreateCcCourseBodyParams): Promise<void> {
		this.logger.log(`calling the API with course title: ${createCcCourseBodyParams.name}`);
		await this.importApi.commonCartridgeImportControllerImportFile(createCcCourseBodyParams);
	}
}
