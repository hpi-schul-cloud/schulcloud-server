import { UnauthorizedException } from '@nestjs/common';
import * as cookie from 'cookie';
import { Request } from 'express';
import { ExtractJwt, JwtFromRequestFunction } from 'passport-jwt';

export class JwtExtractor {
	public static fromCookie(name: string): JwtFromRequestFunction {
		return (request: Request) => {
			let token: string | null = null;
			const cookies = cookie.parse(request.headers.cookie || '');
			if (cookies && cookies[name]) {
				token = cookies[name];
			}
			return token;
		};
	}

	public static extractJwtFromRequest(request: Request): string {
		const jwt = ExtractJwt.fromAuthHeaderAsBearerToken()(request);

		if (!jwt) {
			throw new UnauthorizedException('No JWT token found');
		}

		return jwt;
	}
}

export const extractJwtFromHeader = ExtractJwt.fromExtractors([
	ExtractJwt.fromAuthHeaderAsBearerToken(),
	JwtExtractor.fromCookie('jwt'),
]);
