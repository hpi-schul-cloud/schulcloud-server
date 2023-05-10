import { EntityId } from './types';

export interface DomainObjectProps {
	id: EntityId;
}

export interface AuthorizableObject {
	get id(): EntityId;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Visitor {}

export abstract class DomainObject<T extends DomainObjectProps> implements AuthorizableObject {
	protected props: T;

	constructor(props: T) {
		this.props = props;
	}

	get id(): EntityId {
		return this.props.id;
	}

	public getProps(): T {
		const copyProps = { ...this.props };

		return copyProps;
	}
}

export abstract class DomainObjectWithVisitor<T extends DomainObjectProps> extends DomainObject<T> {
	abstract accept(visitor: Visitor): void;

	abstract acceptAsync(visitor: Visitor): Promise<void>;
}
