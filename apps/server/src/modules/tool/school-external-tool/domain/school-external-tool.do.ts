import { BaseDO } from '@shared/domain/domainobject/base.do';
import { CustomParameterEntry } from '../../common/domain';
import { ToolVersion } from '../../common/interface';
import { SchoolExternalToolConfigurationStatus } from '../controller/dto';

export interface SchoolExternalToolProps {
	id?: string;

	name?: string;

	toolId: string;

	schoolId: string;

	parameters: CustomParameterEntry[];

	toolVersion: number;

	status?: SchoolExternalToolConfigurationStatus;
}

export class SchoolExternalTool extends BaseDO implements ToolVersion {
	name?: string;

	toolId: string;

	schoolId: string;

	parameters: CustomParameterEntry[];

	toolVersion: number;

	status?: SchoolExternalToolConfigurationStatus;

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

export type SchoolExternalToolWithId = SchoolExternalTool & { id: string };
