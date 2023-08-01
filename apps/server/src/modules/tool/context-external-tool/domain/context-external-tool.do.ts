import { BaseDO } from '@shared/domain/domainobject/base.do';
import { SchoolExternalToolRefDO } from '../../school-external-tool/domain/school-external-tool-ref.do';
import { ContextRef } from './context-ref';
import { CustomParameterEntry } from '../../common/domain';
import { ToolVersion } from '../../common/interface';

export interface ContextExternalToolProps {
	id?: string;

	schoolToolRef: SchoolExternalToolRefDO;

	contextRef: ContextRef;

	displayName?: string;

	parameters: CustomParameterEntry[];

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
