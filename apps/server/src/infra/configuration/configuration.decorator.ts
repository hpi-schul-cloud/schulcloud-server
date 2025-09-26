/* eslint-disable @typescript-eslint/no-explicit-any */
interface PropertyAccessKey {
	propertyKey: string;
	key?: string;
}

export interface WithConfigurationDecorator {
	[key: string]: unknown;
	getConfigKeys(): string[];
}

/**
 * Decorator to mark a class as a configuration class.
 * @returns ClassDecorator
 */
export function Configuration() {
	return function ConfigurationDecorator<T extends new (...args: any[]) => {}>(
		constructor: T
	): T & (new (...args: any[]) => WithConfigurationDecorator) {
		return class extends constructor implements WithConfigurationDecorator {
			constructor(...args: any[]) {
				super(...args);
				const proxyInstance = new Proxy(this, {
					set: (target: any, prop: string | symbol, value: unknown): true => {
						const propertyAccessKeys: PropertyAccessKey[] = this.getPropertyAccessKeys();
						const propKey =
							propertyAccessKeys.find((item: PropertyAccessKey) => item.key === prop)?.propertyKey ?? prop;
						if (propKey) {
							target[propKey] = value;
						}

						return true;
					},
					get: (target: any, prop: string | symbol, receiver: any): any => {
						const value = Reflect.get(target, prop, receiver);

						return value;
					},
				});

				return proxyInstance;
			}
			[key: string]: unknown;

			public getConfigKeys(): string[] {
				const objectKeys = Object.keys(this);
				const propertyAccessKeys: PropertyAccessKey[] = this.getPropertyAccessKeys();
				const keys = propertyAccessKeys.map((item: PropertyAccessKey) => item.key ?? item.propertyKey);

				for (const key of objectKeys) {
					if (!propertyAccessKeys.some((item) => item.propertyKey === key)) {
						keys.push(key);
					}
				}

				return keys;
			}

			private getPropertyAccessKeys(): PropertyAccessKey[] {
				const propertyAccessKeys = Object.getPrototypeOf(this).__propertyAccessKeys ?? [];

				return propertyAccessKeys;
			}
		};
	};
}

/**
 * Decorator to mark a class property as a configuration property.
 * @param key Optional environment variable name to map to the decorated property.If not provided, the property name will be used.
 * @returns PropertyDecorator
 */
export function ConfigProperty(key?: string): PropertyDecorator {
	return function (target: any, propertyKey: string | symbol) {
		target.__propertyAccessKeys ??= [];
		target.__propertyAccessKeys.push({ propertyKey, key });
	};
}
