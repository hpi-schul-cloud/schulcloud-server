import { ICurrentUser } from '@infra/auth-guard';
import { CreateCcCourseBodyParams } from '../controller/dto/common-cartridge-dtos/create-cc-course.body.params';
import { CommonCartridgeImportService } from '../service/common-cartridge-import.service';
import { AuthorizationService } from '@modules/authorization';

export class CommonCartridgeImportUc {
	constructor(
		private readonly authService: AuthorizationService,
		private readonly commonCartridgeImportService: CommonCartridgeImportService
	) {}
	public async importCourse(course: CreateCcCourseBodyParams, currentUser: ICurrentUser): Promise<void> {
		await this.commonCartridgeImportService.importCourse(course, currentUser);
	}
}
