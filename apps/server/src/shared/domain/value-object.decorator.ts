/* eslint-disable @typescript-eslint/no-explicit-any */
import { validateSync } from 'class-validator';

type Constructor<T = object> = new (...args: any[]) => T;

export function ValueObject() {
	return function ValueObjectDecorator<T extends Constructor>(constructor: T): T {
		return class extends constructor {
			constructor(...args: any[]) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				super(...args);

				const errors = validateSync(this, { skipMissingProperties: false });
				if (errors.length > 0) {
					throw new Error(errors.toString());
				}
			}
		};
	};
}
