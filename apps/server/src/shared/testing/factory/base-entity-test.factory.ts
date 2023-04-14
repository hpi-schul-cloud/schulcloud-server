import { BuildOptions, DeepPartial, Factory, GeneratorFn } from 'fishery';
import { ObjectId } from 'mongodb';
import { BaseTestFactory } from './base-test.factory';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class BaseEntityTestFactory<T, U, I = any, C = U> extends BaseTestFactory<T, U, I, C> {
	// TODO: important hint
	// must be moved to this level to allow generation without explit call of:
	// class RoleFactory extends BaseEntityTestFactory<Role, IRoleProperties> {}
	// see: F = BaseEntityTestFactory<T, U, I, C>
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	static define<T, U, I = any, C = U, F = BaseEntityTestFactory<T, U, I, C>>(
		this: new (EntityClass: { new (props: U): T }, propsFactory: Factory<U, I, C>) => F,
		EntityClass: { new (props: U): T },
		generator: GeneratorFn<U, I, C>
	): F {
		const propsFactory = Factory.define<U, I, C>(generator);
		const factory = new this(EntityClass, propsFactory);

		return factory;
	}

	/**
	 * Build an entity using you factory and generate a id for it.
	 */
	public buildWithId(params?: DeepPartial<U>, id?: string, options: BuildOptions<U, I> = {}): T {
		const entity = this.build(params, options);
		const generatedId = new ObjectId(id);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
		const entityWithId = Object.assign(entity as any, { _id: generatedId, id: generatedId.toHexString() });

		return entityWithId as T;
	}

	public buildListWithId(number: number, params?: DeepPartial<U>, options: BuildOptions<U, I> = {}): T[] {
		const list: T[] = [];
		for (let i = 0; i < number; i += 1) {
			list.push(this.buildWithId(params, undefined, options));
		}

		return list;
	}
}
