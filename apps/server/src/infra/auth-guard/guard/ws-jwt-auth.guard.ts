import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

export class WsJwtAuthGuard extends AuthGuard('wsjwt') {
	getRequest(context: ExecutionContext) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
		return context.switchToWs().getClient().handshake;
	}
}
