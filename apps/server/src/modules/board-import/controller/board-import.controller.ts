import { JwtAuthentication } from '@infra/auth-guard';
import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { BoardImportPingResponse } from './dto';

@JwtAuthentication()
@ApiTags('board-import')
@Controller('board-import')
export class BoardImportController {
	@Get('ping')
	@ApiOperation({ summary: 'Check that the board import API is reachable for an authenticated user.' })
	@ApiOkResponse({ type: BoardImportPingResponse })
	@ApiUnauthorizedResponse({ description: 'Request is unauthorized.' })
	public ping(): BoardImportPingResponse {
		const response = new BoardImportPingResponse('pong');

		return response;
	}
}
