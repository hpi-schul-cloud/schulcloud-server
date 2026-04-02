import { ICurrentUser } from '@infra/auth-guard';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Oauth2AuthorizationBodyParams } from '../controllers/dto';
import { Oauth2ContextHelper } from '../helper/oauth2-context.helper';
import { StrategyType } from '../interface';
import { CurrentUserMapper } from '../mapper';

@Injectable()
export class ErwinStrategy extends PassportStrategy(Strategy, StrategyType.ERWIN) {
	constructor(private readonly oauth2ContextHelper: Oauth2ContextHelper) {
		super();
	}

	public async validate(request: { body: Oauth2AuthorizationBodyParams }): Promise<ICurrentUser> {
		const { user, account, systemId } = await this.oauth2ContextHelper.buildOauth2Context(request.body);

		const currentUser = CurrentUserMapper.mapToErwinCurrentUser(account, user, systemId, true);
		return currentUser;
	}
}
