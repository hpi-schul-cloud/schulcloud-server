import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { lastValueFrom } from 'rxjs';
import { FileRequestInfo } from '../interfaces';
import { FileStorageClientMapper } from '../mapper';

const baseURL = 'http://localhost:4444';

enum URI {
	list = 'list',
	restore = 'restore',
	copy = 'copy',
	delete = 'delete',
}

@Injectable()
export class FileStorageClientRepo {
	constructor(private httpService: HttpService) {}

	// 	@Get('/list/:schoolId/:parentType/:parentId')
	private getUrl(uri: URI, fileRequestInfo: FileRequestInfo): string {
		const url = `${baseURL}/${uri}/${fileRequestInfo.schoolId}/${fileRequestInfo.parentType}/${fileRequestInfo.parentId}/`;

		return url;
	}

	async copyFilesOfParent(fileRequestInfo: FileRequestInfo): Promise<[]> {
		const url = this.getUrl(URI.copy, fileRequestInfo);
		const result = await lastValueFrom(this.httpService.get<AxiosResponse>(url));

		// const response = FileStorageClientMapper.mapAxiosToDomainObject(result);
		return Promise.resolve([]);
	}

	async listFilesOfParent(fileRequestInfo: FileRequestInfo): Promise<[]> {
		const url = this.getUrl(URI.list, fileRequestInfo);
		const result = await lastValueFrom(this.httpService.post<AxiosResponse>(url));

		console.log(result);
		// const response = FileStorageClientMapper.mapAxiosToDomainObject(result);
		return Promise.resolve([]);
	}
}
