import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { CustomParameterEntry } from '../../common/domain';
import { SchoolExternalToolConfigurationStatus } from '../controller/dto';

export interface SchoolExternalToolProps extends AuthorizableObject {
	id: string;

	name?: string;

	toolId: string;

	schoolId: string;

	parameters: CustomParameterEntry[];

	status?: SchoolExternalToolConfigurationStatus;
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

	set toolId(value: string) {
		this.props.toolId = value;
	}

	get schoolId(): string {
		return this.props.schoolId;
	}

	set schoolId(value: string) {
		this.props.schoolId = value;
	}

	get parameters(): CustomParameterEntry[] {
		return this.props.parameters;
	}

	set parameters(value: CustomParameterEntry[]) {
		this.props.parameters = value;
	}

	get status(): SchoolExternalToolConfigurationStatus | undefined {
		return this.props.status;
	}

	set status(value: SchoolExternalToolConfigurationStatus | undefined) {
		this.props.status = value;
	}
}
