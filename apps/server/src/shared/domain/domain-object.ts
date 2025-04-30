import { EntityId } from './types';

export interface AuthorizableObject {
	get id(): EntityId;
}

export abstract class DomainObject<T extends AuthorizableObject> implements AuthorizableObject {
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
