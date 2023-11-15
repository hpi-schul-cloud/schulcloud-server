import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import Strategy from 'passport-headerapikey';
import { IXApiKeyConfig } from '../config/x-api-key.config';

@Injectable()
export class XApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
	private readonly allowedApiKeys: string[];

	constructor(private readonly configService: ConfigService<IXApiKeyConfig, true>) {
		super({ header: 'X-API-KEY' }, true);
		this.allowedApiKeys = this.configService.get<string[]>('ADMIN_API__ALLOWED_API_KEYS');
	}

	public validate = (apiKey: string, done: (error: Error | null, data: boolean | null) => void) => {
		if (this.allowedApiKeys.includes(apiKey)) {
			done(null, true);
		}
		done(new UnauthorizedException(), null);
	};
}
