import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { CustomParameterEntry } from '../../common/domain';
import { SchoolExternalToolRef } from '../../school-external-tool/domain';
import { ContextRef } from './context-ref';

export interface ContextExternalToolProps extends AuthorizableObject {
	id: string;

	schoolToolRef: SchoolExternalToolRef;

	contextRef: ContextRef;

	displayName?: string;

	parameters: CustomParameterEntry[];
}

export class ContextExternalTool extends DomainObject<ContextExternalToolProps> {
	get schoolToolRef(): SchoolExternalToolRef {
		return this.props.schoolToolRef;
	}

	set schoolToolRef(value: SchoolExternalToolRef) {
		this.props.schoolToolRef = value;
	}

	get contextRef(): ContextRef {
		return this.props.contextRef;
	}

	set contextRef(value: ContextRef) {
		this.props.contextRef = value;
	}

	get displayName(): string | undefined {
		return this.props.displayName;
	}

	set displayName(value: string | undefined) {
		this.props.displayName = value;
	}

	get parameters(): CustomParameterEntry[] {
		return this.props.parameters;
	}

	set parameters(value: CustomParameterEntry[]) {
		this.props.parameters = value;
	}
}
