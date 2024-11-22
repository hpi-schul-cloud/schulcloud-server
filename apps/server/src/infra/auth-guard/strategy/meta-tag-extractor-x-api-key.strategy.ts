import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import Strategy from 'passport-headerapikey';
import { StrategyType } from '../interface';
import { MetaTagExtractorXApiKeyAuthGuardConfig } from '../config';

@Injectable()
export class MetaTagExtractorXApiKeyStrategy extends PassportStrategy(
	Strategy,
	StrategyType.METATAG_EXTRACTOR_API_KEY
) {
	private readonly allowedApiKeys: string[];

	constructor(private readonly configService: ConfigService<MetaTagExtractorXApiKeyAuthGuardConfig, true>) {
		super({ header: 'X-API-KEY' }, false);
		this.allowedApiKeys = this.configService.getOrThrow<string[]>('META_TAG_EXTRACTOR_API__ALLOWED_API_KEYS');
	}

	public validate = (apiKey: string, done: (error: Error | null, data: boolean | null) => void) => {
		if (this.allowedApiKeys.includes(apiKey)) {
			done(null, true);
		}
		done(new UnauthorizedException(), null);
	};
}
