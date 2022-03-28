import { Request } from 'express';
import { JwtFromRequestFunction } from 'passport-jwt';
import cookie from 'cookie';

export class JwtExtractor {
	static fromCookie(name: string): JwtFromRequestFunction {
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
