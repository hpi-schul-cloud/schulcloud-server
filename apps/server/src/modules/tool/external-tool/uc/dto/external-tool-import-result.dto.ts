export class ExternalToolImportResult {
	toolName: string;

	mediumId?: string;

	mediumSourceId?: string;

	toolId?: string;

	error?: string;

	constructor(props: ExternalToolImportResult) {
		this.toolName = props.toolName;
		this.mediumId = props.mediumId;
		this.mediumSourceId = props.mediumSourceId;
		this.toolId = props.toolId;
		this.error = props.error;
	}
}
