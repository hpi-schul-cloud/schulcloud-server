export interface ExternalToolSearchQuery {
	name?: string;

	clientId?: string;

	isHidden?: boolean;

	ids?: string[];

	isPreferred?: boolean;

	isTemplateAndDraftAllowed?: boolean;

	isTemplateAllowed?: boolean;
}
