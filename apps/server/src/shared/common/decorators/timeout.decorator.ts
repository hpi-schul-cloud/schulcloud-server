import { applyDecorators, SetMetadata } from '@nestjs/common';

/**
 * Sets a custom timeout for an endpoint.
 *
 * @param requestTimeoutEnvironmentName - The property name from the module's TimeoutInterceptorConfig implementation
 *
 * IMPORTANT: Use property names from the config class registered with CoreModule.register() in your module.
 * If the property doesn't exist in the registered config, the interceptor will fall back to the default timeout.
 *
 * @example @RequestTimeout('incomingRequestTimeoutCopyApi')
 */
export function RequestTimeout(requestTimeoutEnvironmentName: string) {
	return applyDecorators(SetMetadata('requestTimeoutEnvironmentName', requestTimeoutEnvironmentName));
}
