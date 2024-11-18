import { applyDecorators, UseGuards } from '@nestjs/common';
import { MetaTagExtractorXApiKeyGuard } from '../guard';

export const MetaTagExtractorXApiKeyAuthentication = () => {
	const decorator = applyDecorators(UseGuards(MetaTagExtractorXApiKeyGuard));

	return decorator;
};
