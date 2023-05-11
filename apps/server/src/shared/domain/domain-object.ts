import { AuthorizableObject } from './authorizable-object';
import { EntityId } from './types';

export interface DomainObjectProps {
	id: EntityId;
}

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

export abstract class DomainObjectWithVisitor<
	T extends DomainObjectProps,
	Visitor,
	AsnycVisitor
> extends DomainObject<T> {
	abstract accept(visitor: Visitor): void;

	abstract acceptAsync(visitor: AsnycVisitor): Promise<void>;
}
