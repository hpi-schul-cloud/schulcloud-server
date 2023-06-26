import { CustomParameterEntryDO } from './custom-parameter-entry.do';
import { BaseDO } from '../base.do';
import { ToolConfigurationStatus } from './tool-configuration-status';
import { ToolVersion } from './types';

export interface SchoolExternalToolProps {
	id?: string;

	name?: string;

	toolId: string;

	schoolId: string;

	parameters: CustomParameterEntryDO[];

	toolVersion: number;

	status?: ToolConfigurationStatus;
}

export class SchoolExternalToolDO extends BaseDO implements ToolVersion {
	name?: string;

	toolId: string;

	schoolId: string;

	parameters: CustomParameterEntryDO[];

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
