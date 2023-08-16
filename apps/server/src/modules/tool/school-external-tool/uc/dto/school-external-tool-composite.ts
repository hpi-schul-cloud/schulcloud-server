import { CustomParameterEntry, ToolConfigurationStatus } from '../../../common/domain';

export interface SchoolExternalToolCompositeProps {
	id?: string;

	name?: string;

	toolId: string;

	schoolId: string;

	parameters: CustomParameterEntry[];

	toolVersion: number;

	status?: ToolConfigurationStatus;

	logoUrl?: string;
}

export class SchoolExternalToolComposite {
	id?: string;

	name?: string;

	toolId: string;

	schoolId: string;

	parameters: CustomParameterEntry[];

	toolVersion: number;

	status?: ToolConfigurationStatus;

	logoUrl?: string;

	constructor(props: SchoolExternalToolCompositeProps) {
		this.id = props.id;
		this.name = props.name;
		this.toolId = props.toolId;
		this.schoolId = props.schoolId;
		this.parameters = props.parameters;
		this.toolVersion = props.toolVersion;
		this.status = props.status;
		this.logoUrl = props.logoUrl;
	}
}
