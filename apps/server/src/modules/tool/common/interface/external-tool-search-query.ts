export interface ExternalToolSearchQuery {
	name?: string;

	clientId?: string;

	isHidden?: boolean;

	ids?: string[];

	isPreferred?: boolean;

	isTemplateAllowed?: boolean;

	isDraftAllowed?: boolean;
}
