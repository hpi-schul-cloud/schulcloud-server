import { Injectable } from '@nestjs/common';
import { SessionInfoResponse } from '../controllers/dto';
import { SessionService } from '../services';

@Injectable()
export class SessionUc {
	constructor(private readonly sessionService: SessionService) {}

	public async extendSession(accessToken: string): Promise<SessionInfoResponse> {
		const result = await this.sessionService.extendSession(accessToken);

		const sessionInfoResponse = new SessionInfoResponse(result);

		return sessionInfoResponse;
	}
}
