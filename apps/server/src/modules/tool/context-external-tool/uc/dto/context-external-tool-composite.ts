import { ContextRef } from '../../domain';
import { SchoolExternalToolRefDO } from '../../../school-external-tool/domain';
import { CustomParameterEntry } from '../../../common/domain';

export interface ContextExternalToolCompositeProps {
	id?: string;

	schoolToolRef: SchoolExternalToolRefDO;

	contextRef: ContextRef;

	displayName?: string;

	parameters: CustomParameterEntry[];

	toolVersion: number;

	logoUrl?: string;
}

export class ContextExternalToolComposite {
	id?: string;

	schoolToolRef: SchoolExternalToolRefDO;

	contextRef: ContextRef;

	displayName?: string;

	parameters: CustomParameterEntry[];

	toolVersion: number;

	logoUrl?: string;

	constructor(props: ContextExternalToolCompositeProps) {
		this.id = props.id;
		this.schoolToolRef = props.schoolToolRef;
		this.contextRef = props.contextRef;
		this.displayName = props.displayName;
		this.parameters = props.parameters;
		this.toolVersion = props.toolVersion;
		this.logoUrl = props.logoUrl;
	}
}
