import { BaseDO } from '@shared/domain/domainobject/base.do';
import { CustomParameterEntry } from '../../common/domain/custom-parameter-entry.do';
import { ToolConfigurationStatus } from '../../common/enum/tool-configuration-status';
import { ToolVersion } from '../../common/interface/tool-version.interface';

export interface SchoolExternalToolProps {
	id?: string;

	name?: string;

	toolId: string;

	schoolId: string;

	parameters: CustomParameterEntry[];

	toolVersion: number;

	status?: ToolConfigurationStatus;
}

export class SchoolExternalTool extends BaseDO implements ToolVersion {
	name?: string;

	toolId: string;

	schoolId: string;

	parameters: CustomParameterEntry[];

	toolVersion: number;

	status?: ToolConfigurationStatus;

	constructor(props: SchoolExternalToolProps) {
		super(props.id);
		this.name = props.name;
		this.toolId = props.toolId;
		this.schoolId = props.schoolId;
		this.parameters = props.parameters;
		this.toolVersion = props.toolVersion;
		this.status = props.status;
	}

	getVersion(): number {
		return this.toolVersion;
	}
}
