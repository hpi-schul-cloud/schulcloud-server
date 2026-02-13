import { UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import Strategy from 'passport-headerapikey';
import { InternalXApiKeyAuthGuardConfig, StrategyType } from '../interface';

export class XApiKeyStrategy extends PassportStrategy(Strategy, StrategyType.API_KEY) {
	constructor(private readonly config: InternalXApiKeyAuthGuardConfig) {
		super({ header: 'X-API-KEY' }, false);
	}

	public validate = (apiKey: string, done: (error: Error | null, data: boolean | null) => void): void => {
		if (this.config.allowedApiKeys.includes(apiKey)) {
			done(null, true);
		}
		done(new UnauthorizedException(), null);
	};
}
