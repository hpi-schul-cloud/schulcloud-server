export class ExternalToolImportResult {
	public toolName: string;

	public mediumId?: string;

	public mediumSourceId?: string;

	public toolId?: string;

	public error?: string;

	constructor(props: ExternalToolImportResult) {
		this.toolName = props.toolName;
		this.mediumId = props.mediumId;
		this.mediumSourceId = props.mediumSourceId;
		this.toolId = props.toolId;
		this.error = props.error;
	}
}
