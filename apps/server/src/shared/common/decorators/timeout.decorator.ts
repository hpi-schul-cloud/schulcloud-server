import { applyDecorators, SetMetadata } from '@nestjs/common';

export function RequestTimeout(requestTimeoutEnvirementName: string) {
	return applyDecorators(SetMetadata('requestTimeoutEnvirementName', requestTimeoutEnvirementName));
}
