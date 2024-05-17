import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { CustomParameterEntry } from '../../common/domain';
import { SchoolExternalToolRef } from '../../school-external-tool/domain';
import { ContextRef } from './context-ref';

export interface ContextExternalToolLaunchable {
	id?: string;

	schoolToolRef: SchoolExternalToolRef;

	contextRef: ContextRef;

	parameters: CustomParameterEntry[];
}

export interface ContextExternalToolProps extends AuthorizableObject, ContextExternalToolLaunchable {
	id: string;

	displayName?: string;
}

export class ContextExternalTool extends DomainObject<ContextExternalToolProps> {
	get schoolToolRef(): SchoolExternalToolRef {
		return this.props.schoolToolRef;
	}

	set schoolToolRef(schoolToolRef: SchoolExternalToolRef) {
		this.props.schoolToolRef = schoolToolRef;
	}

	get contextRef(): ContextRef {
		return this.props.contextRef;
	}

	set contextRef(contextRef: ContextRef) {
		this.props.contextRef = contextRef;
	}

	get displayName(): string | undefined {
		return this.props.displayName;
	}

	get parameters(): CustomParameterEntry[] {
		return this.props.parameters;
	}

	set parameters(parameters: CustomParameterEntry[]) {
		this.props.parameters = parameters;
	}
}
