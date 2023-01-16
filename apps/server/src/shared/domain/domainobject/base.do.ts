import { EntityId } from '../types';

interface BaseDOProps {
	id: EntityId;
}

export abstract class BaseDO<T extends BaseDOProps> {
	props: T; // possible to make it protected

	constructor(props: T) {
		this.props = props;
	}

	get id() {
		return this.props.id;
	}
}
