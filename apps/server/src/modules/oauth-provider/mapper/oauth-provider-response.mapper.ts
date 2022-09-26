import { Injectable } from '@nestjs/common';
import { ProviderLoginResponse, ProviderRedirectResponse } from '@shared/infra/oauth-provider/dto';
import { RedirectResponse } from '@src/modules/oauth-provider/controller/dto/response/redirect.response';
import { LoginResponse } from '@src/modules/oauth-provider/controller/dto/response/login.response';

@Injectable()
export class OauthProviderResponseMapper {
	mapRedirectResponse(redirect: ProviderRedirectResponse): RedirectResponse {
		return new RedirectResponse({ ...redirect });
	}

	mapLoginResponse(providerLoginResponse: ProviderLoginResponse): LoginResponse {
		return new LoginResponse({ ...providerLoginResponse });
	}
}
