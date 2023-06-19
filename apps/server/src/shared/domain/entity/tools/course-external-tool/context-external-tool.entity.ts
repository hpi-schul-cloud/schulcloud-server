import { Embedded, Entity, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '../../base.entity';
import { CustomParameterEntry } from '../custom-parameter-entry';
import { SchoolExternalTool } from '../school-external-tool/school-external-tool.entity';
import { ContextExternalToolType } from './context-external-tool-type.enum';

export interface IContextExternalToolProperties {
	schoolTool: SchoolExternalTool;

	contextId: string;

	contextType: ContextExternalToolType;

	displayName?: string;

	parameters?: CustomParameterEntry[];

	toolVersion: number;
}

@Entity({ tableName: 'context_external_tools' })
export class ContextExternalTool extends BaseEntityWithTimestamps {
	@ManyToOne()
	schoolTool: SchoolExternalTool;

	@Property()
	contextId: string;

	@Property()
	contextType: ContextExternalToolType;

	@Property({ nullable: true })
	displayName?: string;

	@Embedded(() => CustomParameterEntry, { array: true })
	parameters: CustomParameterEntry[];

	@Property()
	toolVersion: number;

	constructor(props: IContextExternalToolProperties) {
		super();
		this.schoolTool = props.schoolTool;
		this.contextId = props.contextId;
		this.contextType = props.contextType;
		this.displayName = props.displayName;
		this.parameters = props.parameters ?? [];
		this.toolVersion = props.toolVersion;
	}
}
