import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { extractJwtFromHeader } from '@shared/common';
import { Request } from 'express';
import { FilesStorageClientConfig } from './files-storage-client.config';
import { Configuration, FileApiFactory, FileApiInterface } from './generated';

@Injectable()
export class FilesStorageClientFactory {
	constructor(
		@Inject(REQUEST) private readonly request: Request,
		private readonly configService: ConfigService<FilesStorageClientConfig, true>
	) {}

	/**
	 * Creates a new file client and configures it with the provided token or the token from the request.
	 * @param token can be provided to override the token from the request.
	 * @returns fully configured file client.
	 */
	public createFileClient(token?: string): FileApiInterface {
		const client = FileApiFactory(
			new Configuration({
				accessToken: this.getJwt(token),
				basePath: this.configService.getOrThrow<string>('FILES_STORAGE__SERVICE_BASE_URL'),
			})
		);

		return client;
	}

	private getJwt(token?: string): () => string {
		return () => {
			const jwt = token ?? extractJwtFromHeader(this.request);

			if (!jwt) {
				throw new UnauthorizedException();
			}

			return jwt;
		};
	}
}
