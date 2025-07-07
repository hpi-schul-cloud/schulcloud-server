import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable()
export class CollaboraProxyService {
	constructor(private readonly httpService: HttpService) {}

	public proxyDocument(fileRecordId: string, jwt: string, req: Request, res: Response): void {
		res.redirect(
			307,
			`http://localhost:9980/browser/e724e42045/cool.html?WOPISrc=http://localhost:4444/api/v3/wopi/files/${fileRecordId}&access_token=${jwt}`
		);
	}
}
