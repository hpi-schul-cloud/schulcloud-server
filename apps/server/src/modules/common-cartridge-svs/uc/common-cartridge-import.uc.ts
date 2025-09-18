import { ICurrentUser } from '@infra/auth-guard';
import { CreateCcCourseBodyParams } from '../contorller/common-cartridge-dtos/create-cc-course.body.params';
import { CommonCartridgeImportService } from '../service/common-cartridge-import.service';
import { Injectable } from '@nestjs/common';
import { LegacyLogger } from '@core/logger';

@Injectable()
export class CommonCartridgeImportUc {
	constructor(
		private readonly commonCartridgeImportService: CommonCartridgeImportService,
		private readonly logger: LegacyLogger
	) {}
	public async importCourse(course: CreateCcCourseBodyParams, currentUser: ICurrentUser): Promise<void> {
		this.logger.log(`Importing course with title in uc: ${course.name}`);
		await this.commonCartridgeImportService.importCourse(course, currentUser);
	}
}
