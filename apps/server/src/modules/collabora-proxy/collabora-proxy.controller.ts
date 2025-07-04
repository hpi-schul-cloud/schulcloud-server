import { JwtAuthentication } from '@infra/auth-guard';
import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { CollaboraProxyService } from './collabora-proxy.service';

@ApiTags('Collabora Proxy')
@JwtAuthentication()
@Controller('collabora-proxy')
export class CollaboraProxyController {
	constructor(private readonly service: CollaboraProxyService) {}

	@Get('document')
	public async getDocument(@Query('fileRecordId') fileRecordId: string, @Req() req: Request, @Res() res: Response) {
		// Extract JWT from request (assuming Bearer token in Authorization header)
		const authHeader = req.headers['authorization'] || '';
		const jwt = authHeader.replace('Bearer ', '');
		return this.service.proxyDocument(fileRecordId, jwt, req, res);
	}
}
