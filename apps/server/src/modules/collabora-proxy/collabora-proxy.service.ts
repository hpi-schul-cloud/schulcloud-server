import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class CollaboraProxyService {
	constructor(private readonly httpService: HttpService) {}

	public async proxyDocument(fileRecordId: string, jwt: string, req: Request, res: Response): Promise<void> {
		// Construct the Collabora URL
		const collaboraUrl = `http://localhost:9980/browser/e724e42045/cool.html?WOPISrc=http://localhost:4444/api/v3/wopi/files/${fileRecordId}?access_token=${jwt}`;
		try {
			const response$ = this.httpService.get(collaboraUrl, { responseType: 'stream' });
			const response = await lastValueFrom(response$);
			res.set(response.headers);
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
			response.data.pipe(res);
		} catch (error) {
			throw new HttpException('Failed to proxy Collabora document', HttpStatus.BAD_GATEWAY);
		}
	}
}
