import { ToolContextType } from '@src/modules/tool/interface';
import { CustomParameterEntryDO } from './custom-parameter-entry.do';
import { SchoolExternalToolRefDO } from './school-external-tool-ref.do';
import { DomainObject } from '../../domain-object';
import { EntityId } from '../../types';

export interface ContextExternalProps {
	id: EntityId;

	schoolToolRef: SchoolExternalToolRefDO;

	contextId: string;

	contextType: ToolContextType;

	contextToolName: string;

	parameters: CustomParameterEntryDO[];

	toolVersion: number;

	createdAt?: Date;

	updatedAt?: Date;
}

export class ContextExternalToolDO extends DomainObject<ContextExternalProps> {
	schoolToolRef: SchoolExternalToolRefDO;

	contextId: string;

	contextType: ToolContextType;

	contextToolName: string;

	parameters: CustomParameterEntryDO[];

	toolVersion: number;

	createdAt?: Date;

	updatedAt?: Date;

	constructor(props: ContextExternalProps) {
		super(props);
		this.schoolToolRef = props.schoolToolRef;
		this.contextId = props.contextId;
		this.contextType = props.contextType;
		this.contextToolName = props.contextToolName;
		this.parameters = props.parameters;
		this.toolVersion = props.toolVersion;
		this.createdAt = props.createdAt;
		this.updatedAt = props.updatedAt;
	}
}
