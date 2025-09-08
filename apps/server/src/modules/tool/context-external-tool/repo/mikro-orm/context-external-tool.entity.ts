import { Embedded, Entity, ManyToOne, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';
import { CustomParameterEntryEntity } from '../../../common/entity';
import { SchoolExternalToolEntity } from '../../../school-external-tool/repo';
import { ContextExternalToolType } from './context-external-tool-type.enum';
import { LtiDeepLinkEmbeddable } from './lti-deep-link.embeddable';

export interface ContextExternalToolEntityProps {
	id?: EntityId;

	schoolTool: SchoolExternalToolEntity;

	contextId: EntityId | ObjectId;

	contextType: ContextExternalToolType;

	displayName?: string;

	parameters?: CustomParameterEntryEntity[];

	ltiDeepLink?: LtiDeepLinkEmbeddable;
}

@Entity({ tableName: 'context-external-tools' })
export class ContextExternalToolEntity extends BaseEntityWithTimestamps {
	@ManyToOne()
	schoolTool: SchoolExternalToolEntity;

	@Property()
	contextId: ObjectId;

	@Property()
	contextType: ContextExternalToolType;

	@Property({ nullable: true })
	displayName?: string;

	@Embedded(() => CustomParameterEntryEntity, { array: true })
	parameters: CustomParameterEntryEntity[];

	@Embedded(() => LtiDeepLinkEmbeddable, { nullable: true, object: true })
	ltiDeepLink?: LtiDeepLinkEmbeddable;

	constructor(props: ContextExternalToolEntityProps) {
		super();
		if (props.id) {
			this.id = props.id;
		}
		this.schoolTool = props.schoolTool;
		this.contextId = new ObjectId(props.contextId);
		this.contextType = props.contextType;
		this.displayName = props.displayName;
		this.parameters = props.parameters ?? [];
		this.ltiDeepLink = props.ltiDeepLink;
	}
}
