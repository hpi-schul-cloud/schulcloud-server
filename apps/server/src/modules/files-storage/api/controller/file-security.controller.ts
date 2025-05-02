import { Body, Controller, Get, Param, Put, Req, StreamableFile } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { FilesStorageUC } from '../uc';
import { ScanResultParams } from '../dto';

@ApiTags('file-security')
@Controller('file-security')
export class FileSecurityController {
	constructor(private readonly filesStorageUC: FilesStorageUC) {}

	@ApiExcludeEndpoint()
	@Get('/download/:token')
	public async downloadBySecurityToken(@Param('token') token: string, @Req() req: Request): Promise<StreamableFile> {
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
	@Put('/update-status/:token')
	public async updateSecurityStatus(
		@Body() scanResultDto: ScanResultParams,
		@Param('token') token: string
	): Promise<{ status: string }> {
		await this.filesStorageUC.updateSecurityStatus(token, scanResultDto);

		return { status: 'ok' };
	}
}
