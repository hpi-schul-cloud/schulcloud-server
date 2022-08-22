import { applyDecorators, SetMetadata } from '@nestjs/common';

export function Timeout(ms: number) {
	return applyDecorators(SetMetadata('timeout', ms));
}
