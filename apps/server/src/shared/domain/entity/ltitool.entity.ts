import { Entity, Property } from '@mikro-orm/core';
import { Optional } from '@nestjs/common';
import { BaseEntityWithTimestamps } from './base.entity';

export type ILtiToolProperties = Readonly<Omit<LtiTool, keyof BaseEntityWithTimestamps>>;

@Entity({ tableName: 'ltitools' })
export class LtiTool extends BaseEntityWithTimestamps {
	@Property()
	name: string;

	@Property()
	@Optional()
	oAuthClientId?: string;

	@Property()
	@Optional()
	secret?: string;

	constructor(props: ILtiToolProperties) {
		super();
		this.name = props.name;
		this.oAuthClientId = props.oAuthClientId;
		this.secret = props.secret;
	}
}
