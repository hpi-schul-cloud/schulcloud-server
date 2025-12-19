import { BuildOptions, DeepPartial, Factory, GeneratorFn, HookFn } from 'fishery';
import { AnyBoardNodeProps, BoardNodeType, pathOfChildren } from '../../domain';
import { BoardNodeEntity } from '../../repo';

export type PropsWithType<T extends AnyBoardNodeProps> = T & { type: BoardNodeType };

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
export class BoardNodeEntityFactory<T extends AnyBoardNodeProps, I = any, C = T, P = DeepPartial<T>> {
	protected readonly propsFactory: Factory<T, I, C, P>;

	constructor(propsFactory: Factory<T, I, C, P>) {
		this.propsFactory = propsFactory;
	}

	/**
	 * Define a factory
	 * @template T The entity to be built
	 * @template I The transient parameters that your factory supports
	 * @template C The class of the factory object being created.
	 * @param EntityClass The constructor of the entity to be built.
	 * @param generator Your factory function - see `Factory.define()` in thoughtbot/fishery
	 * @returns
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public static define<
		T extends AnyBoardNodeProps,
		I = any,
		C = BoardNodeEntity,
		P = DeepPartial<T>,
		F = BoardNodeEntityFactory<T, I, C, P>
	>(this: new (propsFactory: Factory<T, I, C, P>) => F, generator: GeneratorFn<T, I, C, P>): F {
		const propsFactory = Factory.define<T, I, C, P>(generator);
		const factory = new this(propsFactory);
		return factory;
	}

	public withParent(parent: BoardNodeEntity): BoardNodeEntityFactory<T, I, C, P> {
		return this.params({ path: pathOfChildren(parent), level: parent.level + 1 } as P);
	}

	/**
	 * Build an entity using your factory
	 * @param params
	 * @returns an entity
	 */
	public build(params?: P, options: BuildOptions<T, I> = {}): BoardNodeEntity {
		const props = this.propsFactory.build(params, options);
		const entity = new BoardNodeEntity();
		Object.assign(entity, props);

		return entity;
	}

	/**
	 * Build an entity using your factory and generate a id for it.
	 * @param params
	 * @param id
	 * @returns an entity
	 */
	public buildWithId(params?: P, id?: string, options: BuildOptions<T, I> = {}): BoardNodeEntity {
		const entity = this.build(params, options);
		if (id) {
			entity.id = id;
		}

		return entity;
	}

	/**
	 * Build a list of entities using your factory
	 * @param number
	 * @param params
	 * @returns a list of entities
	 */
	public buildList(number: number, params?: P, options: BuildOptions<T, I> = {}): BoardNodeEntity[] {
		const list: BoardNodeEntity[] = [];
		for (let i = 0; i < number; i += 1) {
			list.push(this.build(params, options));
		}

		return list;
	}

	public buildListWithId(number: number, params?: P, options: BuildOptions<T, I> = {}): BoardNodeEntity[] {
		const list: BoardNodeEntity[] = [];
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
	public afterBuild(afterBuildFn: HookFn<T>): this {
		const newPropsFactory = this.propsFactory['clone']();
		newPropsFactory.afterBuild(afterBuildFn);
		const newFactory = this.clone(newPropsFactory);

		return newFactory;
	}

	/**
	 * Extend the factory by adding default associations to be passed to the factory when "build" is called
	 * @param associations
	 * @returns a new factory
	 */
	public associations(associations: Partial<T>): this {
		const newPropsFactory = this.propsFactory['clone']();
		newPropsFactory.associations(associations);
		const newFactory = this.clone(newPropsFactory);

		return newFactory;
	}

	/**
	 * Extend the factory by adding default parameters to be passed to the factory when "build" is called
	 * @param params
	 * @returns a new factory
	 */
	public params(params: P): this {
		const newPropsFactory = this.propsFactory['clone']();
		newPropsFactory.params(params);
		const newFactory = this.clone(newPropsFactory);

		return newFactory;
	}

	/**
	 * Extend the factory by adding default transient parameters to be passed to the factory when "build" is called
	 * @param transient - transient params
	 * @returns a new factory
	 */
	public transient(transient: Partial<I>): this {
		const newPropsFactory = this.propsFactory['clone']();
		newPropsFactory.transient(transient);
		const newFactory = this.clone(newPropsFactory);

		return newFactory;
	}

	/**
	 * Set sequence back to its default value
	 */
	public rewindSequence(): void {
		this.propsFactory.rewindSequence();
	}

	protected clone<F extends BoardNodeEntityFactory<T, I, C, P>>(this: F, propsFactory: Factory<T, I, C, P>): F {
		const copy = new (this.constructor as {
			new (propsOfFactory: Factory<T, I, C, P>): F;
		})(propsFactory);

		return copy;
	}

	/**
	 * Get the next sequence value
	 * @returns the next sequence value
	 */
	protected sequence(): number {
		return this.propsFactory['sequence']();
	}
}
