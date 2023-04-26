import { EntityId } from './types';

export type BaseDOProps = {
	id: EntityId;
};

// TODO: Rename
export abstract class BaseDO2<T extends BaseDOProps> {
	protected props: T;

	constructor(props: T) {
		this.props = props;
	}

	get id() {
		return this.props.id;
	}

	public getProps(): T {
		const copyProps = { ...this.props };

		return copyProps;
	}
}
