import { EntityId } from './types';

export type BaseDOProps = {
	id: EntityId;
};

// TODO: Rename
export abstract class BaseDO2<T> {
	props: T & BaseDOProps; // possible to make it protected

	constructor(props: T & BaseDOProps) {
		this.props = props;
	}

	get id() {
		return this.props.id.toString();
	}

	public getProps(): T {
		return this.props;
	}
}
