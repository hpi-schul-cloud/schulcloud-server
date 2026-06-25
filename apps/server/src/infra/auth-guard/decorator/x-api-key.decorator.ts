import { applyDecorators, UseGuards } from '@nestjs/common';
import { XApiKeyGuard } from '../guard';

export const XApiKeyAuthentication = (): ReturnType<typeof applyDecorators> => {
	const decorator = applyDecorators(UseGuards(XApiKeyGuard));

	return decorator;
};
