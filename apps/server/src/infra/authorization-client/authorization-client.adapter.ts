import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import cookie from 'cookie';
import { Request } from 'express';
import { ExtractJwt, JwtFromRequestFunction } from 'passport-jwt';
import { AuthorizationApi, AuthorizationBodyParams } from './authorization-api-client';
import { AuthorizationErrorLoggableException, AuthorizationForbiddenLoggableException } from './error';

@Injectable()
export class AuthorizationClientAdapter {
	constructor(private readonly authorizationApi: AuthorizationApi, @Inject(REQUEST) private request: Request) {}

	public async checkPermissionByReferences(params: AuthorizationBodyParams): Promise<void> {
		const hasPermission = await this.hasPermissionByReferences(params);
		if (!hasPermission) {
			throw new AuthorizationForbiddenLoggableException(params);
		}
	}

	public async hasPermissionByReferences(params: AuthorizationBodyParams): Promise<boolean> {
		const jwt = this.getJWT();

		try {
			const response = await this.authorizationApi.authorizationReferenceControllerAuthorizeByReference(params, {
				headers: { authorization: `${jwt}` },
			});

			const hasPermission = response.data.isAuthorized;

			return hasPermission;
		} catch (error) {
			throw new AuthorizationErrorLoggableException(error as Error, params);
		}
	}

	private getJWT(): string {
		const getJWT = ExtractJwt.fromExtractors([ExtractJwt.fromAuthHeaderAsBearerToken(), this.fromCookie('jwt')]);
		const jwt = getJWT(this.request) || this.request.headers.authorization;

		if (!jwt) {
			throw new UnauthorizedException('Authentication is required.');
		}

		return jwt;
	}

	private fromCookie(name: string): JwtFromRequestFunction {
		return (request: Request) => {
			let token: string | null = null;
			const cookies = cookie.parse(request.headers.cookie || '');
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			if (cookies && cookies[name]) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
				token = cookies[name];
			}
			return token;
		};
	}
}
