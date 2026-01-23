import { ToolContextType } from '@modules/tool/common/enum';
import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { CustomParameterEntry } from '../../common/domain';
import { SchoolExternalToolConfigurationStatus } from './school-external-tool-configuration-status';
import { SchoolExternalToolMedium } from './school-external-tool-medium';

export interface SchoolExternalToolProps extends AuthorizableObject {
	id: string;

	name?: string;

	toolId: string;

	schoolId: string;

	parameters: CustomParameterEntry[];

	isDeactivated: boolean;

	status?: SchoolExternalToolConfigurationStatus;

	restrictToContexts?: ToolContextType[];

	medium?: SchoolExternalToolMedium;
}

export class SchoolExternalTool extends DomainObject<SchoolExternalToolProps> {
	get name(): string | undefined {
		return this.props.name;
	}

	set name(value: string | undefined) {
		this.props.name = value;
	}

	get toolId(): string {
		return this.props.toolId;
	}

	get schoolId(): string {
		return this.props.schoolId;
	}

	get parameters(): CustomParameterEntry[] {
		return this.props.parameters;
	}

	get isDeactivated(): boolean {
		return this.props.isDeactivated;
	}

	get status(): SchoolExternalToolConfigurationStatus {
		return this.props.status ?? { isOutdatedOnScopeSchool: false, isGloballyDeactivated: false };
	}

	set status(value: SchoolExternalToolConfigurationStatus) {
		this.props.status = value;
	}

	get restrictToContexts(): ToolContextType[] | undefined {
		return this.props.restrictToContexts;
	}

	get medium(): SchoolExternalToolMedium | undefined {
		return this.props.medium;
	}

	public activate(): void {
		this.props.isDeactivated = false;
	}
}
