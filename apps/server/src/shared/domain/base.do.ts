import { EntityId } from './types';

export type BaseDOProps = {
	id: EntityId;
};

// TODO: Rename
export abstract class BaseDO2<T> {
	protected props: T & BaseDOProps; // possible to make it protected
	// it is possible to hold the entity as reference on this place, but then we have implicit
	// the orm in our domain

	constructor(props: T & BaseDOProps) {
		this.props = props;
	}

	get id() {
		return this.props.id.toString();
	}

	public getProps(): T & BaseDOProps {
		const copyProps = { ...this.props };

		return copyProps;
	}
}
