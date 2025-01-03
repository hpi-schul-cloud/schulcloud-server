import { UnauthorizedException } from '@nestjs/common';
import cookie from 'cookie';
import { Request } from 'express';
import { ExtractJwt, JwtFromRequestFunction } from 'passport-jwt';

export class JwtExtractor {
	static fromCookie(name: string): JwtFromRequestFunction {
		return (request: Request) => {
			let token: string | null = null;
			const cookies = cookie.parse(request.headers.cookie || '');
			if (cookies && cookies[name]) {
				token = cookies[name];
			}
			return token;
		};
	}
}

export const extractJwtFromHeader = ExtractJwt.fromExtractors([
	ExtractJwt.fromAuthHeaderAsBearerToken(),
	JwtExtractor.fromCookie('jwt'),
]);

export function extractJwtFromRequest(request: Request): string {
	const jwt = extractJwtFromHeader(request);

	if (!jwt) {
		throw new UnauthorizedException();
	}

	return jwt;
}
