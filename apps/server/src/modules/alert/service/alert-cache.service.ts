import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StatusAdapter } from '../adapter';
import { Message } from '../controller/dto';
import { AlertConfig } from '../alert.config';

@Injectable()
export class AlertCacheService {
	private readonly cacheInterval: number;

	private lastUpdatedTimestamp = 0;

	private messages: Message[] = [];

	private messageProviders: StatusAdapter[] = [];

	private readonly instance: string;

	constructor(
		private readonly configService: ConfigService<AlertConfig, true>,
		private readonly statusAdapter: StatusAdapter
	) {
		this.instance = configService.get<string>('SC_THEME');
		this.cacheInterval = configService.get('ALERT_CACHE_INTERVAL_MIN');

		if (configService.get('ALERT_STATUS_URL')) {
			this.addMessageProvider(statusAdapter, true);
		}
	}

	public async updateMessages() {
		let success = false;
		let newMessages: Message[] = [];
		this.lastUpdatedTimestamp = Date.now();

		const promises = this.messageProviders.map(async (provider) => {
			const data = await provider.getMessage(this.instance);
			if (!data.success) {
				success = false;
				return;
			}
			newMessages = newMessages.concat(data.messages);
			success = true;
		});

		await Promise.all(promises);

		if (success) {
			this.messages = newMessages;
		}
	}

	public async getMessages() {
		if (this.lastUpdatedTimestamp < Date.now() - 1000 * 60 * this.cacheInterval) {
			await this.updateMessages();
		}

		return this.messages || [];
	}

	public addMessageProvider(provider: StatusAdapter, featureEnabled: boolean) {
		if (featureEnabled) {
			this.messageProviders.push(provider);
		}
	}
}
