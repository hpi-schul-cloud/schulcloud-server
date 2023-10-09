import { AnyEntity, Collection, wrap } from '@mikro-orm/core';

export class MikroOrmRepoUtils {
	public static checkIfRequiredPropsArePopulated<T extends AnyEntity>(entity: T, keysOfMandatoryProps: Array<keyof T>) {
		for (const [key, value] of Object.entries(entity)) {
			if (keysOfMandatoryProps.includes(key)) {
				if (value instanceof Collection) {
					// TODO: IMO this should return false when not populated but it doesn't. Try with school.systems.
					// Maybe a bug in MikroOrm...
					console.log('isInitialized: ', value.isInitialized());
					// If this would work, then:
					if (!value.isInitialized()) {
						// TODO: Create loggable exception.
						throw new Error('must be populated');
					}
				} else if (!wrap(value).isInitialized()) {
					throw new Error('must be populated');
				}
			}
		}
	}

	public static removeOptionalReferencesIfNotPopulated<T extends AnyEntity>(
		entity: T,
		keysOfOptionalProps: Array<keyof T>
	): void {
		for (const [key, value] of Object.entries(entity)) {
			if (keysOfOptionalProps.includes(key)) {
				if (value instanceof Collection) {
					// TODO: IMO this should return false when not populated but it doesn't. Try with school.systems.
					// Maybe a bug in MikroOrm...
					console.log('isInitialized: ', value.isInitialized());
					// If this would work, then:
					if (!value.isInitialized()) {
						delete entity[key];
					}
				} else if (!wrap(value).isInitialized()) {
					delete entity[key];
				}
			}
		}
	}
}
