import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { AuthenticationService } from '../services/authentication.service';

export type RequestBody = { ticket: string };

@Injectable()
export class TspStrategy extends PassportStrategy(Strategy, 'tsp') {
	constructor(private readonly authenticationService: AuthenticationService) {
		super();
	}
	/*
	async validate(request: { body: RequestBody }): Promise<ICurrentUser> {
		const { ticket } = request.body;


	}

	private async decryptTicket(ticket: string): Promise<unknown> {
		try {
			const verifiedTicket = await JWS.verify(ticket, undefined, {
				algorithms: ['']
			})
		}
	}
	*/
}
