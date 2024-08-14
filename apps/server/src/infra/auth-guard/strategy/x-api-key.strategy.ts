import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import Strategy from 'passport-headerapikey';
import { XApiKeyConfig } from '../config';
import { StrategyType } from '../interface';

@Injectable()
export class XApiKeyStrategy extends PassportStrategy(Strategy, StrategyType.API_KEY) {
	private readonly allowedApiKeys: string[];

	constructor(private readonly configService: ConfigService<XApiKeyConfig, true>) {
		super({ header: 'X-API-KEY' }, false);
		this.allowedApiKeys = this.configService.get<string[]>('ADMIN_API__ALLOWED_API_KEYS');
	}

	public validate = (apiKey: string, done: (error: Error | null, data: boolean | null) => void) => {
		if (this.allowedApiKeys.includes(apiKey)) {
			done(null, true);
		}
		done(new UnauthorizedException(), null);
	};
}
