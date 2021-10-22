import { DeepPartial, Factory, GeneratorFn, HookFn } from 'fishery';

/**
 * Entity factory based on thoughtbot/fishery
 * https://github.com/thoughtbot/fishery
 *
 * @template T The entity to be built
 * @template U The properties interface of the entity
 * @template I The transient parameters that your factory supports
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class BaseFactory<T, U, I = any> {
	protected readonly propsFactory: Factory<U>;

	constructor(private readonly EntityClass: { new (props: U): T }, propsFactory: Factory<U>) {
		this.propsFactory = propsFactory;
	}

	/**
	 * Define a factory
	 * @template T The entity to be built
	 * @template U The properties interface of the entity
	 * @template I The transient parameters that your factory supports
	 * @param EntityClass The constructor of the entity to be built.
	 * @param generator Your factory function - see `Factory.define()` in thoughtbot/fishery
	 * @returns
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	static define<T, U, I = any, F = BaseFactory<T, U>>(
		this: new (EntityClass: { new (props: U): T }, propsFactory: Factory<U, I>) => F,
		EntityClass: { new (props: U): T },
		generator: GeneratorFn<U, I>
	): F {
		const propsFactory = Factory.define<U, I>(generator);
		const factory = new this(EntityClass, propsFactory);

		return factory;
	}

	/**
	 * Build an entity using your factory
	 * @param params
	 * @returns an entity
	 */
	build(params: DeepPartial<U> = {}): T {
		const props = this.propsFactory.build(params);
		const entity = new this.EntityClass(props);

		return entity;
	}

	/**
	 * Build a list of entities using your factory
	 * @param number
	 * @param params
	 * @returns a list of entities
	 */
	buildList(number: number, params: DeepPartial<U> = {}): T[] {
		const list: T[] = [];
		for (let i = 0; i < number; i += 1) {
			list.push(this.build(params));
		}

		return list;
	}

	/**
	 * Extend the factory by adding a function to be called after an object is built.
	 * @param afterBuildFn - the function to call. It accepts your object of type T. The value this function returns gets returned from "build"
	 * @returns a new factory
	 */
	afterBuild(afterBuildFn: HookFn<U>): this {
		// eslint-disable-next-line @typescript-eslint/dot-notation
		const newPropsFactory = this.propsFactory['clone']();
		newPropsFactory.afterBuild(afterBuildFn);
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
		// eslint-disable-next-line @typescript-eslint/dot-notation
		const newPropsFactory = this.propsFactory['clone']();
		newPropsFactory.transient(transient);
		const newFactory = this.clone(newPropsFactory);

		return newFactory;
	}

	/**
	 * Set sequence back to its default value
	 */
	rewindSequence(): void {
		this.propsFactory.rewindSequence();
	}

	protected clone<F extends BaseFactory<T, U>>(this: F, propsFactory: Factory<U>): F {
		const copy = new (this.constructor as {
			new (EntityClass: { new (props: U): T }, propsFactory: Factory<U>): F;
		})(this.EntityClass, propsFactory);

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
