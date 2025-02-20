import { LtiDeepLinkToken } from '../domain/lti-deep-link-token';

export interface LtiDeepLinkTokenRepo {
	save(domainObject: LtiDeepLinkToken): Promise<LtiDeepLinkToken>;

	delete(domainObject: LtiDeepLinkToken): Promise<void>;

	findByState(state: string): Promise<LtiDeepLinkToken | null>;
}

export const LTI_DEEP_LINK_TOKEN_REPO = 'LTI_DEEP_LINK_TOKEN_REPO';
