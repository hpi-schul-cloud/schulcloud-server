import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { CustomParameterEntry } from '../../common/domain';
import { SchoolExternalToolRef } from '../../school-external-tool/domain';
import { ContextRef } from './context-ref';
import { LtiDeepLink } from './lti-deep-link';

export interface ContextExternalToolLaunchable {
	id?: string;

	schoolToolRef: SchoolExternalToolRef;

	contextRef: ContextRef;

	parameters: CustomParameterEntry[];

	ltiDeepLink?: LtiDeepLink;
}

export interface ContextExternalToolProps extends AuthorizableObject, ContextExternalToolLaunchable {
	id: string;

	displayName?: string;
}

export class ContextExternalTool extends DomainObject<ContextExternalToolProps> {
	get schoolToolRef(): SchoolExternalToolRef {
		return this.props.schoolToolRef;
	}

	get contextRef(): ContextRef {
		return this.props.contextRef;
	}

	get displayName(): string | undefined {
		return this.props.displayName;
	}

	get parameters(): CustomParameterEntry[] {
		return this.props.parameters;
	}

	get ltiDeepLink(): LtiDeepLink | undefined {
		return this.props.ltiDeepLink;
	}

	set ltiDeepLink(value: LtiDeepLink | undefined) {
		this.props.ltiDeepLink = value;
	}
}
