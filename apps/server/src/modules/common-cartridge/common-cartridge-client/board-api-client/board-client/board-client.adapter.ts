import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { extractJwtFromHeader } from '@shared/common';
import { RawAxiosRequestConfig } from 'axios';
import { Request } from 'express';
import { BoardApi } from './board-api-client';

@Injectable()
export class BoardClientAdapter {
	constructor(private readonly boardApi: BoardApi, @Inject(REQUEST) private request: Request) {}

	private createOptionParams(): RawAxiosRequestConfig {
		const jwt = this.getJwt();
		const options: RawAxiosRequestConfig = { headers: { authorization: `Bearer ${jwt}` } };

		return options;
	}

	private getJwt(): string {
		const jwt = extractJwtFromHeader(this.request) ?? this.request.headers.authorization;

		if (!jwt) {
			throw new UnauthorizedException('No JWT found in request');
		}

		return jwt;
	}
}
