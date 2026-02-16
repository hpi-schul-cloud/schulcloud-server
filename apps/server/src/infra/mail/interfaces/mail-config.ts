export interface InternalMailConfig {
	exchangeName: string;
	exchangeType: string;
	mailSendRoutingKey: string;
	blocklistOfEmailDomains: string[];
	shouldSendEmail: boolean;
}
