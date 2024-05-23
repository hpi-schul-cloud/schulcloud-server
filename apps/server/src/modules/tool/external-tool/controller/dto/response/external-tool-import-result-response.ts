import { ApiProperty } from '@nestjs/swagger';

export class ExternalToolImportResultResponse {
	toolName: string;

	mediumId?: string;

	mediumSourceId?: string;

	toolId?: string;

	error?: string;

	constructor(props: ExternalToolImportResultResponse) {
		this.toolName = props.toolName;
		this.mediumId = props.mediumId;
		this.mediumSourceId = props.mediumSourceId;
		this.toolId = props.toolId;
		this.error = props.error;
	}
}

export class ExternalToolImportResultListResponse {
	@ApiProperty({ type: [ExternalToolImportResultResponse] })
	results: ExternalToolImportResultResponse[];

	constructor(props: ExternalToolImportResultListResponse) {
		this.results = props.results;
	}
}
