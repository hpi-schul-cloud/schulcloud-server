import { BuildOptions, DeepPartial } from 'fishery';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseTestFactory } from '../base-test.factory';

// TODO: remove it and use BaseTestFactory instead, the id generation is not part of it anymore

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class DoBaseFactory<T, U, I = any, C = U> extends BaseTestFactory<T, U, I, C> {
	buildWithId(params?: DeepPartial<U>, id?: string, options: BuildOptions<U, I> = {}): T {
		const domainObject: T = this.build(params, options);
		Object.defineProperty(domainObject, 'id', { value: id ?? new ObjectId().toHexString(), writable: true });

		return domainObject;
	}
}
