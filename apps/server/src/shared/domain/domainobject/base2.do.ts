// TODO: rename file to base.do.ts

import { EntityId } from '../types';

export interface BaseDOProps {
	id: EntityId;
}

export abstract class BaseDO2<T> {
	props: T & BaseDOProps; // possible to make it protected

	constructor(props: T & BaseDOProps) {
		this.props = props;
	}

	get id() {
		return this.props.id;
	}
}
