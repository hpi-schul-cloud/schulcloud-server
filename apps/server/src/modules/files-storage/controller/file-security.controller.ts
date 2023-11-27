import { Body, Controller, Get, Param, Put, Req, StreamableFile } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { FilesStorageInternalActions } from '../files-storage.const';
import { FilesStorageUC } from '../uc';
import { ScanResultParams } from './dto';

@ApiTags('file-security')
@Controller()
export class FileSecurityController {
	constructor(private readonly filesStorageUC: FilesStorageUC) {}

	@ApiExcludeEndpoint()
	@Get(FilesStorageInternalActions.downloadBySecurityToken)
	async downloadBySecurityToken(@Param('token') token: string, @Req() req: Request) {
		const res = await this.filesStorageUC.downloadBySecurityToken(token);
		req.on('close', () => {
			res.data.destroy();
		});

		return new StreamableFile(res.data, {
			type: res.contentType,
			disposition: `attachment;`,
		});
	}

	@ApiExcludeEndpoint()
	@Put(FilesStorageInternalActions.updateSecurityStatus)
	async updateSecurityStatus(@Body() scanResultDto: ScanResultParams, @Param('token') token: string) {
		await this.filesStorageUC.updateSecurityStatus(token, scanResultDto);
	}
}
