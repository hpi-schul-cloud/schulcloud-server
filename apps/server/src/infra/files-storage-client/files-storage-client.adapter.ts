import { Inject, UnauthorizedException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { extractJwtFromHeader } from '@shared/common';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import type { Request } from 'express';
import { FileApi } from './generated';

export class FilesStorageClientAdapter {
	constructor(private readonly api: FileApi, @Inject(REQUEST) private readonly request: Request) {}

	public async download(fileRecordId: string, fileId: string): Promise<Buffer> {
		const config = { ...this.getAxiosRequestConfig(), responseType: 'blob' } as AxiosRequestConfig;
		const response = (await this.api.download(fileRecordId, fileId, undefined, config)) as AxiosResponse<Blob>;
		const file = await response.data.arrayBuffer();
		const buffer = Buffer.from(file);

		return buffer;
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	public async upload(): Promise<void> {
		// const config = this.getAxiosRequestConfig();
		// const blob = new Blob([file]);
		// const formData = new FormData();
		// formData.append('file', blob, 'file');

		// await this.api.upload(fileRecordId, formData, config);

		throw new Error('Method not implemented.');
	}

	private getAxiosRequestConfig(): AxiosRequestConfig {
		const jwt = extractJwtFromHeader(this.request);

		if (!jwt) {
			throw new UnauthorizedException();
		}

		const config: AxiosRequestConfig = {
			headers: {
				Authorization: `Bearer ${jwt}`,
			},
		};

		return config;
	}
}
