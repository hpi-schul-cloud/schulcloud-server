import { Request } from 'express';
import { JwtFromRequestFunction } from 'passport-jwt';

export class JwtExtractor {
	static fromCookie(name: string): JwtFromRequestFunction {
		return (request: Request) => {
			let token: string | null = null;
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			if (request && request.cookies && request.cookies[name]) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
				token = request.cookies[name];
			}
			return token;
		};
	}
}
