import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { Configuration } from '@hpi-schul-cloud/commons';

import { JwtPayload } from '../interface/jwt-payload';

@Injectable()
export class JwtValidationService {
	private client: ClientProxy;

	constructor() {
		this.client = ClientProxyFactory.create({
			transport: Transport.REDIS,
			options: { url: Configuration.get('REDIS_URI') as string },
		});
	}

	private isJwtPayload(payload: null | { [key: string]: any } | string): JwtPayload {
		if (payload === null || typeof payload === 'string') {
			throw new BadRequestException('Invalid authentication data');
		}
		return payload as JwtPayload;
	}

	// redis stuff
	private load(identifier);
	private set(identifier, data, { expiration });

	authenticate(token: string) {
		if (!jwtTokenIsWhitelisted(token)) {
			throw ForbiddenException();
		} else {
			extendJwtTokenExpiration(token); // async?
		}
	}
}
