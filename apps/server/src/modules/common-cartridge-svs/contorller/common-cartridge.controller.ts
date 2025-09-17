import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { CreateCcCourseBodyParams } from '@modules/common-cartridge-svs/contorller/common-cartridge-dtos/create-cc-course.body.params';
import { Post, Body, Controller } from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiBody,
	ApiConsumes,
	ApiCreatedResponse,
	ApiInternalServerErrorResponse,
	ApiOperation,
	ApiTags,
} from '@nestjs/swagger';
import { CommonCartridgeImportUc } from '../uc/common-cartridge-import.uc';
import { LegacyLogger } from '@core/logger';
@JwtAuthentication()
@ApiTags('Import-Common-Cartridge')
@Controller('import-common-cartridge')
export class CommonCartridgeImportController {
	constructor(private readonly courseImportUc: CommonCartridgeImportUc, private readonly logger: LegacyLogger) {}

	@Post('importfile')
	@ApiOperation({ summary: 'Imports a course from the common cartridge microservice' })
	@ApiConsumes('application/json')
	@ApiBody({ type: CreateCcCourseBodyParams, required: true })
	@ApiCreatedResponse({ description: 'Course was successfully imported.' })
	@ApiBadRequestResponse({ description: 'Request data has invalid format.' })
	@ApiInternalServerErrorResponse({ description: 'Internal server error.' })
	public async importFile(
		@CurrentUser() currentUser: ICurrentUser,
		@Body() courseBody: CreateCcCourseBodyParams
	): Promise<void> {
		this.logger.log(`Importing course with title: ${courseBody.name}`);
		await this.courseImportUc.importCourse(courseBody, currentUser);
	}
}
