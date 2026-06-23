import { applyDecorators, UseGuards } from '@nestjs/common';
import { WsJwtAuthGuard } from '../guard';

export const WsJwtAuthentication = (): ReturnType<typeof applyDecorators> => {
	const decorator = applyDecorators(UseGuards(WsJwtAuthGuard));

	return decorator;
};
