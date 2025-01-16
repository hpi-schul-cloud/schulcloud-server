import { BuildOptions, DeepPartial } from 'fishery';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '../base.factory';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class DoBaseFactory<T, U, I = any, C = U> extends BaseFactory<T, U, I, C> {
	override buildWithId(params?: DeepPartial<U>, id?: string, options: BuildOptions<U, I> = {}): T {
		const entity: T = this.build(params, options);
		Object.defineProperty(entity, 'id', { value: id ?? new ObjectId().toHexString(), writable: true });

		return entity;
	}
}
