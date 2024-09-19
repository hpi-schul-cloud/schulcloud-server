import { ObjectId } from '@mikro-orm/mongodb';
import type { EntityId } from '@shared/domain/types';
import { BuildOptions, DeepPartial, Factory, GeneratorFn, HookFn } from 'fishery';

/**
 * Entity factory based on thoughtbot/fishery
 * https://github.com/thoughtbot/fishery
 *
 * @template T The entity to be built
 * @template U The properties interface of the entity
 * @template I The transient parameters that your factory supports
 * @template C The class of the factory object being created.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class EntityFactory<T extends object, U, I = any, C = U> {
	protected readonly propsFactory: Factory<U, I, C>;

	constructor(private readonly EntityClass: { new (): T }, propsFactory: Factory<U, I, C>) {
		this.propsFactory = propsFactory;
	}

	/**
	 * Define a factory
	 * @template T The entity to be built
	 * @template U The properties interface of the entity
	 * @template I The transient parameters that your factory supports
	 * @template C The class of the factory object being created.
	 * @param EntityClass The constructor of the entity to be built.
	 * @param generator Your factory function - see `Factory.define()` in thoughtbot/fishery
	 * @returns
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	static define<T extends object, U, I = any, C = U, F = EntityFactory<T, U, I, C>>(
		this: new (EntityClass: { new (): T }, propsFactory: Factory<U, I, C>) => F,
		EntityClass: { new (): T },
		generator: GeneratorFn<U, I, C>
	): F {
		const propsFactory = Factory.define<U, I, C>(generator);
		const factory = new this(EntityClass, propsFactory);
		return factory;
	}

	/**
	 * Build an entity using your factory
	 * @param params
	 * @returns an entity
	 */
	build(params?: DeepPartial<U>, options: BuildOptions<U, I> = {}): T {
		const props = this.propsFactory.build(params, options);
		const entity = new this.EntityClass();
		Object.assign(entity, props);

		return entity;
	}

	/**
	 * Build an entity using your factory and generate a id for it.
	 * @param params
	 * @param id
	 * @returns an entity
	 */
	buildWithId(params?: DeepPartial<U>, id?: string, options: BuildOptions<U, I> = {}): T {
		const entity = this.build(params, options) as { _id: ObjectId; id: EntityId };
		const generatedId = new ObjectId(id);
		const entityWithId = Object.assign(entity, { _id: generatedId, id: generatedId.toHexString() });

		return entityWithId as T;
	}

	/**
	 * Build a list of entities using your factory
	 * @param number
	 * @param params
	 * @returns a list of entities
	 */
	buildList(number: number, params?: DeepPartial<U>, options: BuildOptions<U, I> = {}): T[] {
		const list: T[] = [];
		for (let i = 0; i < number; i += 1) {
			list.push(this.build(params, options));
		}

		return list;
	}

	buildListWithId(number: number, params?: DeepPartial<U>, options: BuildOptions<U, I> = {}): T[] {
		const list: T[] = [];
		for (let i = 0; i < number; i += 1) {
			list.push(this.buildWithId(params, undefined, options));
		}

		return list;
	}

	/**
	 * Extend the factory by adding a function to be called after an object is built.
	 * @param afterBuildFn - the function to call. It accepts your object of type T. The value this function returns gets returned from "build"
	 * @returns a new factory
	 */
	afterBuild(afterBuildFn: HookFn<U>): this {
		const newPropsFactory = this.propsFactory.afterBuild(afterBuildFn);
		const newFactory = this.clone(newPropsFactory);

		return newFactory;
	}

	/**
	 * Extend the factory by adding default associations to be passed to the factory when "build" is called
	 * @param associations
	 * @returns a new factory
	 */
	associations(associations: Partial<U>): this {
		const newPropsFactory = this.propsFactory.associations(associations);
		const newFactory = this.clone(newPropsFactory);

		return newFactory;
	}

	/**
	 * Extend the factory by adding default parameters to be passed to the factory when "build" is called
	 * @param params
	 * @returns a new factory
	 */
	params(params: DeepPartial<U>): this {
		const newPropsFactory = this.propsFactory.params(params);
		const newFactory = this.clone(newPropsFactory);

		return newFactory;
	}

	/**
	 * Extend the factory by adding default transient parameters to be passed to the factory when "build" is called
	 * @param transient - transient params
	 * @returns a new factory
	 */
	transient(transient: Partial<I>): this {
		const newPropsFactory = this.propsFactory.transient(transient);
		const newFactory = this.clone(newPropsFactory);

		return newFactory;
	}

	/**
	 * Set sequence back to its default value
	 */
	rewindSequence(): void {
		this.propsFactory.rewindSequence();
	}

	protected clone<F extends EntityFactory<T, U, I, C>>(this: F, propsFactory: Factory<U, I, C>): F {
		const copy = new (this.constructor as {
			new (propsOfFactory: Factory<U, I, C>): F;
		})(propsFactory);

		return copy;
	}

	/**
	 * Get the next sequence value
	 * @returns the next sequence value
	 */
	protected sequence(): number {
		// eslint-disable-next-line @typescript-eslint/dot-notation
		return this.propsFactory['sequence']();
	}
}
