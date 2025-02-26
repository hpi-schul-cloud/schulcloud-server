import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { CommonCartridgeFileValidatorPipe } from '@modules/common-cartridge/controller/utils';
import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
	ApiBadRequestResponse,
	ApiBody,
	ApiConsumes,
	ApiCreatedResponse,
	ApiInternalServerErrorResponse,
	ApiOperation,
	ApiTags,
} from '@nestjs/swagger';
import { CourseImportUc } from '../uc';
import { CourseImportBodyParams } from './dto';

// @deprecated - will to be removed in the EW-1076
@ApiTags('Courses')
@JwtAuthentication()
@Controller('courses')
export class CourseController {
	constructor(private readonly courseImportUc: CourseImportUc) {}

	@Post('import')
	@UseInterceptors(FileInterceptor('file'))
	@ApiOperation({ summary: 'Imports a course from a Common Cartridge file.' })
	@ApiConsumes('multipart/form-data')
	@ApiBody({ type: CourseImportBodyParams, required: true })
	@ApiCreatedResponse({ description: 'Course was successfully imported.' })
	@ApiBadRequestResponse({ description: 'Request data has invalid format.' })
	@ApiInternalServerErrorResponse({ description: 'Internal server error.' })
	public async importCourse(
		@CurrentUser() currentUser: ICurrentUser,
		@UploadedFile(CommonCartridgeFileValidatorPipe)
		file: Express.Multer.File
	): Promise<void> {
		await this.courseImportUc.importFromCommonCartridge(currentUser.userId, file.buffer);
	}
}
