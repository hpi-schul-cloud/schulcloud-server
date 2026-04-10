/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
interface PropertyAccessKey {
	propertyKey: string | symbol;
	key?: string | symbol;
}

export interface WithConfigurationDecorator {
	[key: string]: unknown;
	getConfigKeys(): (string | symbol)[];
}

/**
 * Decorator to mark a class as a configuration class.
 * @returns ClassDecorator
 */
export function Configuration() {
	return function ConfigurationDecorator<T extends new (...args: any[]) => object>(constructor: T): T {
		return class extends constructor {
			constructor(...args: any[]) {
				super(...args);
				const proxyInstance = new Proxy(this, {
					set: (target: any, prop: string | symbol, value: unknown): true => {
						const propertyAccessKeys = this.getPropertyAccessKeys();
						const propKey = propertyAccessKeys.find((item) => item.key === prop)?.propertyKey ?? prop;
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

				// eslint-disable-next-line @typescript-eslint/no-unsafe-return
				return proxyInstance;
			}

			public getConfigKeys(): (string | symbol)[] {
				const objectKeys = Object.keys(this);
				const propertyAccessKeys = this.getPropertyAccessKeys();
				const keys = propertyAccessKeys.map((item) => item.key ?? item.propertyKey);

				for (const key of objectKeys) {
					if (!propertyAccessKeys.some((item) => item.propertyKey === key)) {
						keys.push(key);
					}
				}

				return keys;
			}

			private getPropertyAccessKeys(): PropertyAccessKey[] {
				const proto = Object.getPrototypeOf(this) as { __propertyAccessKeys?: PropertyAccessKey[] };
				const propertyAccessKeys = proto.__propertyAccessKeys ?? [];

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
	return function (target: { __propertyAccessKeys?: PropertyAccessKey[] }, propertyKey: string | symbol) {
		target.__propertyAccessKeys ??= [];
		target.__propertyAccessKeys.push({ propertyKey, key });
	};
}
