import { BaseDO } from '@shared/domain/domainobject/base.do';
import { CustomParameterEntry } from '../../common/domain';
import { ToolVersion } from '../../common/interface';
import { SchoolExternalToolRefDO } from '../../school-external-tool/domain';
import { ContextRef } from './context-ref';

export interface ContextExternalToolLaunchable {
	id?: string;

	schoolToolRef: SchoolExternalToolRefDO;

	contextRef: ContextRef;

	parameters: CustomParameterEntry[];
}

export interface ContextExternalToolProps extends ContextExternalToolLaunchable {
	displayName?: string;

	toolVersion: number;
}

export class ContextExternalTool extends BaseDO implements ToolVersion {
	schoolToolRef: SchoolExternalToolRefDO;

	contextRef: ContextRef;

	displayName?: string;

	parameters: CustomParameterEntry[];

	toolVersion: number;

	constructor(props: ContextExternalToolProps) {
		super(props.id);
		this.schoolToolRef = props.schoolToolRef;
		this.contextRef = props.contextRef;
		this.displayName = props.displayName;
		this.parameters = props.parameters;
		this.toolVersion = props.toolVersion;
	}

	getVersion(): number {
		return this.toolVersion;
	}
}

// TODO: N21-1885: Remove this type and alls its usages
export type ContextExternalToolWithId = ContextExternalTool & { id: string };
