import { ApiProperty } from '@nestjs/swagger';

export class ExternalToolImportResultResponse {
	@ApiProperty({ description: 'Name of the external tool' })
	public toolName: string;

	@ApiProperty({ description: 'Medium id of the external tool' })
	public mediumId?: string;

	@ApiProperty({ description: 'Medium source of the external tool' })
	public mediumSourceId?: string;

	@ApiProperty({ description: 'ObjectId of the created external tool' })
	public toolId?: string;

	@ApiProperty({ description: 'Status message of the error that occurred' })
	public error?: string;

	constructor(props: ExternalToolImportResultResponse) {
		this.toolName = props.toolName;
		this.mediumId = props.mediumId;
		this.mediumSourceId = props.mediumSourceId;
		this.toolId = props.toolId;
		this.error = props.error;
	}
}

export class ExternalToolImportResultListResponse {
	@ApiProperty({
		type: [ExternalToolImportResultResponse],
		description: 'List of operation results for the provided external tools',
	})
	public results: ExternalToolImportResultResponse[];

	constructor(props: ExternalToolImportResultListResponse) {
		this.results = props.results;
	}
}
