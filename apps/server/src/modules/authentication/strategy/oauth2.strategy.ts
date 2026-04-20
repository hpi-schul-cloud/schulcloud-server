/* eslint-disable filename-rules/match */
import type { ICurrentUser } from '@infra/auth-guard';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Oauth2AuthorizationBodyParams } from '../controllers/dto';
import { Oauth2ContextHelper, Oauth2ContextResult } from '../helper/oauth2-context.helper';
import { StrategyType } from '../interface';
import { CurrentUserMapper } from '../mapper';

@Injectable()
export class Oauth2Strategy extends PassportStrategy(Strategy, StrategyType.OAUTH2) {
	constructor(private readonly oauth2ContextHelper: Oauth2ContextHelper) {
		super();
	}

	public async validate(request: { body: Oauth2AuthorizationBodyParams }): Promise<ICurrentUser> {
		const result: Oauth2ContextResult = await this.oauth2ContextHelper.buildOauth2Context(request.body);

		const currentUser = CurrentUserMapper.mapToOauthCurrentUser(
			result.account.id,
			result.user,
			result.systemId,
			result.tokenDto.idToken
		);
		return currentUser;
	}
}
