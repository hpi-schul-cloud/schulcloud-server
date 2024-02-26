import { applyDecorators, SetMetadata } from '@nestjs/common';

export function RequestTimeout(requestTimeoutEnvironmentName: string) {
	return applyDecorators(SetMetadata('requestTimeoutEnvironmentName', requestTimeoutEnvironmentName));
}
