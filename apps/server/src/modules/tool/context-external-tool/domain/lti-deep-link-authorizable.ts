export class LtiDeepLinkAuthorizable {
	state: string;

	oauthVersion: string;

	oauthNonce: string;

	oauthTimestamp: string;

	oauthSignatureMethod: string;

	oauthConsumerKey: string;

	oauthSignature: string;

	constructor(props: LtiDeepLinkAuthorizable) {
		this.state = props.state;
		this.oauthVersion = props.oauthVersion; // TODO is this needed?
		this.oauthNonce = props.oauthNonce;
		this.oauthTimestamp = props.oauthTimestamp;
		this.oauthSignatureMethod = props.oauthSignatureMethod; // TODO is this needed?
		this.oauthConsumerKey = props.oauthConsumerKey;
		this.oauthSignature = props.oauthSignature;
	}
}
