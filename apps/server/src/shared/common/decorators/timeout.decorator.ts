import { applyDecorators, SetMetadata } from '@nestjs/common';

export function RequestTimeout(ms: number) {
	return applyDecorators(SetMetadata('timeout', ms));
}
