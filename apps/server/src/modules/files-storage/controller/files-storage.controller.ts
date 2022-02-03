import { Body, Controller, Get, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiProperty, ApiTags } from '@nestjs/swagger';
import { ICurrentUser } from '@shared/domain';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { Express } from 'express';
import { FilesStorageUC } from '../uc/files-storage.uc';
import { FileUploadDto } from './dto/file-upload.dto';

@ApiBearerAuth()
@ApiTags('files-storage')
@Authenticate('jwt')
@Controller('files-storage')
export class FilesStorageController {
	constructor(private readonly filesStorageUC: FilesStorageUC) {}

	@UseInterceptors(FileInterceptor('file'))
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		description: 'Upload file',
		type: FileUploadDto,
	})
	@Post('upload/')
	uploadFile(
		@Body() body: FileUploadDto,
		@UploadedFile() file: Express.Multer.File,
		@CurrentUser() currentUser: ICurrentUser
	) {
		const res = this.filesStorageUC.upload(currentUser, body.meta, file);
		return res;
	}

	@ApiProperty({ type: String })
	@Get('/download/:schoolId/:uuid')
	async download(
		@Param('schoolId') schoolId: string,
		@Param('uuid') uuid: string,
		@CurrentUser() currentUser: ICurrentUser
	) {
		const res = await this.filesStorageUC.download(currentUser, schoolId, uuid);
		return res;
	}
}
