import { JWT } from '@infra/auth-guard';
import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SessionUc } from '../uc';
import { SessionInfoResponse } from './dto';

@ApiTags('Authentication')
@Controller('session')
export class SessionController {
	constructor(private readonly sessionUc: SessionUc) {}

	@HttpCode(HttpStatus.OK)
	@Post('extend')
	@ApiOperation({ summary: 'Extends the lifetime of the current session.' })
	@ApiResponse({ status: 200, description: 'Session was successfully extended.' })
	@ApiResponse({ status: 401, description: 'Unauthorized.' })
	public async extendSession(@JWT() accessToken: string): Promise<SessionInfoResponse> {
		const sessionInfoResponse = await this.sessionUc.extendSession(accessToken);

		return sessionInfoResponse;
	}
}
