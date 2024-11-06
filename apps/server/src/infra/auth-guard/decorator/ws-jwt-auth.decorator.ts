import { applyDecorators, UseGuards } from '@nestjs/common';
import { WsJwtAuthGuard } from '../guard';

export const WsJwtAuthentication = () => {
	const decorator = applyDecorators(UseGuards(WsJwtAuthGuard));

	return decorator;
};
