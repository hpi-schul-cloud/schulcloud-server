import { Test, TestingModule } from '@nestjs/testing';
import { NotImplementedException } from '@nestjs/common';
import {
	AcceptConsentRequestBody,
	AcceptLoginRequestBody,
	IntrospectResponse,
	ProviderConsentResponse,
	ProviderLoginResponse,
	ProviderOauthClient,
	ProviderRedirectResponse,
	RejectRequestBody,
} from '@shared/infra/oauth-provider/dto';
import { OauthProviderService } from '@shared/infra/oauth-provider/oauth-provider.service';
import { ProviderConsentSessionResponse } from '@shared/infra/oauth-provider/dto/response/consent-session.response';

class OauthProviderServiceSpec extends OauthProviderService {
	getLoginRequest(challenge: string): Promise<ProviderLoginResponse> {
		return super.getLoginRequest(challenge);
	}

	acceptLoginRequest(challenge: string, body: AcceptLoginRequestBody): Promise<ProviderRedirectResponse> {
		return super.acceptLoginRequest(challenge, body);
	}

	rejectLoginRequest(challenge: string, body: RejectRequestBody): Promise<ProviderRedirectResponse> {
		return super.rejectLoginRequest(challenge, body);
	}

	getConsentRequest(challenge: string): Promise<ProviderConsentResponse> {
		return super.getConsentRequest(challenge);
	}

	acceptConsentRequest(challenge: string, body: AcceptConsentRequestBody): Promise<ProviderRedirectResponse> {
		return super.acceptConsentRequest(challenge, body);
	}

	rejectConsentRequest(challenge: string, body: RejectRequestBody): Promise<ProviderRedirectResponse> {
		return super.rejectConsentRequest(challenge, body);
	}

	acceptLogoutRequest(challenge: string): Promise<ProviderRedirectResponse> {
		return super.acceptLogoutRequest(challenge);
	}

	introspectOAuth2Token(token: string, scope?: string): Promise<IntrospectResponse> {
		return super.introspectOAuth2Token(token, scope);
	}

	isInstanceAlive(): Promise<boolean> {
		return super.isInstanceAlive();
	}

	listOAuth2Clients(): Promise<ProviderOauthClient[]> {
		return super.listOAuth2Clients();
	}

	createOAuth2Client(data: ProviderOauthClient): Promise<ProviderOauthClient> {
		return super.createOAuth2Client(data);
	}

	getOAuth2Client(id: string): Promise<ProviderOauthClient> {
		return super.getOAuth2Client(id);
	}

	updateOAuth2Client(id: string, data: ProviderOauthClient): Promise<ProviderOauthClient> {
		return super.updateOAuth2Client(id, data);
	}

	deleteOAuth2Client(id: string): Promise<void> {
		return super.deleteOAuth2Client(id);
	}

	listConsentSessions(user: string): Promise<ProviderConsentSessionResponse[]> {
		return super.listConsentSessions(user);
	}

	revokeConsentSession(user: string, client: string): Promise<void> {
		return super.revokeConsentSession(user, client);
	}
}

describe('OauthProviderService', () => {
	let module: TestingModule;
	let service: OauthProviderServiceSpec;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [OauthProviderServiceSpec],
		}).compile();

		service = module.get(OauthProviderServiceSpec);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('Consent Flow', () => {
		describe('getConsentRequest', () => {
			it('should throw', () => {
				expect(() => service.getConsentRequest('')).toThrow(NotImplementedException);
			});
		});

		describe('acceptConsentRequest', () => {
			it('should throw', () => {
				expect(() => service.acceptConsentRequest('', {})).toThrow(NotImplementedException);
			});
		});

		describe('rejectConsentRequest', () => {
			it('should throw', () => {
				expect(() => service.rejectConsentRequest('', {})).toThrow(NotImplementedException);
			});
		});

		describe('listConsentSessions', () => {
			it('should throw', () => {
				expect(() => service.listConsentSessions('')).toThrow(NotImplementedException);
			});
		});

		describe('revokeConsentSession', () => {
			it('should throw', () => {
				expect(() => service.revokeConsentSession('', '')).toThrow(NotImplementedException);
			});
		});
	});

	describe('Login Flow', () => {
		describe('getLoginRequest', () => {
			it('should throw', () => {
				expect(() => service.getLoginRequest('')).toThrow(NotImplementedException);
			});
		});

		describe('acceptLoginRequest', () => {
			it('should throw', () => {
				expect(() => service.acceptLoginRequest('', { subject: '' })).toThrow(NotImplementedException);
			});
		});

		describe('rejectLoginRequest', () => {
			it('should throw', () => {
				expect(() => service.rejectLoginRequest('', {})).toThrow(NotImplementedException);
			});
		});
	});

	describe('Logout Flow', () => {
		describe('acceptLogoutRequest', () => {
			it('should throw', () => {
				expect(() => service.acceptLogoutRequest('')).toThrow(NotImplementedException);
			});
		});
	});

	describe('Client Flow', () => {
		describe('listOAuth2Clients', () => {
			it('should throw', () => {
				expect(() => service.listOAuth2Clients()).toThrow(NotImplementedException);
			});
		});

		describe('getOAuth2Client', () => {
			it('should throw', () => {
				expect(() => service.getOAuth2Client('')).toThrow(NotImplementedException);
			});
		});

		describe('createOAuth2Client', () => {
			it('should throw', () => {
				expect(() => service.createOAuth2Client({})).toThrow(NotImplementedException);
			});
		});

		describe('updateOAuth2Client', () => {
			it('should throw', () => {
				expect(() => service.updateOAuth2Client('', {})).toThrow(NotImplementedException);
			});
		});

		describe('deleteOAuth2Client', () => {
			it('should throw', () => {
				expect(() => service.deleteOAuth2Client('')).toThrow(NotImplementedException);
			});
		});
	});

	describe('Miscellaneous', () => {
		describe('introspectOAuth2Token', () => {
			it('should throw', () => {
				expect(() => service.introspectOAuth2Token('')).toThrow(NotImplementedException);
			});
		});

		describe('isInstanceAlive', () => {
			it('should throw', () => {
				expect(() => service.isInstanceAlive()).toThrow(NotImplementedException);
			});
		});
	});
});
