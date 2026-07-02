import { performance } from 'node:perf_hooks';

const CALLBACK_METHOD_NAME = 'trackExecutionTime';

export function TrackExecutionTime(): MethodDecorator {
	return function track(target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
		if (typeof target[CALLBACK_METHOD_NAME] !== 'function') {
			throw new TypeError(
				`The class ${target.constructor.name} does not implement the required ${CALLBACK_METHOD_NAME} method.`
			);
		}

		const originalMethod = descriptor.value as () => unknown;
		descriptor.value = async function wrapper(...args: []): Promise<unknown> {
			const startTime = performance.now();
			const result = await originalMethod.apply(this, args);
			const executionTime = performance.now() - startTime;

			const callback = target[CALLBACK_METHOD_NAME] as (methodName: string, executionTime: number) => void;
			callback.apply(this, [String(propertyKey), executionTime]);

			return result;
		};
		return descriptor;
	};
}
