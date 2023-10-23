import { AnyEntity, Collection, wrap } from '@mikro-orm/core';

export class MikroOrmRepoUtils {
	public static checkIfRequiredRefsArePopulated<T extends AnyEntity>(entity: T, keysOfRequiredRefs: Array<keyof T>) {
		for (const [key, value] of Object.entries(entity)) {
			if (keysOfRequiredRefs.includes(key) && !this.isRefInitialized(value)) {
				// TODO: Create error loggable for this
				throw new Error('must be populated');
			}
		}
	}

	public static removeOptionalRefsIfNotPopulated<T extends AnyEntity>(
		entity: T,
		keysOfRequiredRefs: Array<keyof T>
	): void {
		for (const [key, value] of Object.entries(entity)) {
			if (keysOfRequiredRefs.includes(key) && !this.isRefInitialized(value)) {
				delete entity[key];
			}
		}
	}

	private static isRefInitialized(ref: unknown): boolean {
		let isInitialized = true;

		if (ref instanceof Collection) {
			isInitialized = this.isCollectionInitialized(ref);
		} else if (!wrap(ref).isInitialized()) {
			isInitialized = false;
		}

		return isInitialized;
	}

	private static isCollectionInitialized(ref: Collection<AnyEntity>): boolean {
		let isInitialized = true;

		// For ManyToMany relations the collection is always initialized regardless if the items are initialized.
		// MikroOrm does not intend to change this, see: https://github.com/mikro-orm/mikro-orm/issues/4815
		// Thus we also check if the first item is initialized. (This is enough because either all or none items are initialized.)
		if (!ref.isInitialized()) {
			isInitialized = false;
		} else if (ref.count() > 0 && !wrap(ref[0]).isInitialized()) {
			isInitialized = false;
		}

		return isInitialized;
	}
}
