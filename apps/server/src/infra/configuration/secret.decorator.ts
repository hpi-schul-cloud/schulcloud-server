const SECRET_PROPERTY_KEYS = Symbol('secretPropertyKeys');

type WithSecretPropertyKeys = { [SECRET_PROPERTY_KEYS]?: (string | symbol)[] };

/**
 * Marks a config property as secret. Its value is collected when the config is loaded
 * and masked in all log output.
 */
export function Secret(): PropertyDecorator {
	return (target: object, propertyKey: string | symbol): void => {
		const inheritedKeys = getSecretPropertyKeys(target);
		// stored on the prototype, like the keys of @ConfigProperty()
		Object.defineProperty(target, SECRET_PROPERTY_KEYS, {
			value: [...inheritedKeys, propertyKey],
			configurable: true,
		});
	};
}

export const getSecretPropertyKeys = (target: object): (string | symbol)[] =>
	(target as WithSecretPropertyKeys)[SECRET_PROPERTY_KEYS] ?? [];
