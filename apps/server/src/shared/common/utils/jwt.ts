import { Request } from 'express';
import { ExtractJwt, JwtFromRequestFunction } from 'passport-jwt';
import cookie from 'cookie';

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
