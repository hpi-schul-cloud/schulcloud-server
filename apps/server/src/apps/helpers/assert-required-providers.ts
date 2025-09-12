import { INestApplicationContext, Type } from '@nestjs/common';

type AnyFunction = (...args: any[]) => any;

export const assertRequiredProviders = <TInput = any>(
	app: INestApplicationContext,
	tokens: (Type<TInput> | AnyFunction | string | symbol)[]
): void => {
	for (const token of tokens) {
		try {
			app.get(token);
		} catch {
			throw new Error(`Missing required provider: ${token.toString()}`);
		}
	}
};
