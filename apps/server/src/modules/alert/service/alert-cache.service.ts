import { Inject, Injectable } from '@nestjs/common';
import { StatusAdapter } from '../adapter';
import { ALERT_CONFIG, AlertConfig } from '../alert.config';
import { Message } from '../controller/dto';

@Injectable()
export class AlertCacheService {
	private lastUpdatedTimestamp = 0;

	private messages: Message[] = [];

	private messageProviders: StatusAdapter[] = [];

	constructor(
		@Inject(ALERT_CONFIG) private readonly config: AlertConfig,
		private readonly statusAdapter: StatusAdapter
	) {
		if (this.config.alertStatusUrl) {
			this.addMessageProvider(this.statusAdapter, true);
		}
	}

	public async updateMessages(): Promise<void> {
		let success = false;
		let newMessages: Message[] = [];
		this.lastUpdatedTimestamp = Date.now();

		const promises = this.messageProviders.map(async (provider) => {
			const data = await provider.getMessage(this.config.scTheme);
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

	public async getMessages(): Promise<Message[]> {
		if (this.lastUpdatedTimestamp < Date.now() - 1000 * 60 * this.config.alertCacheIntervalMin) {
			await this.updateMessages();
		}

		return this.messages || [];
	}

	public addMessageProvider(provider: StatusAdapter, featureEnabled: boolean): void {
		if (featureEnabled) {
			this.messageProviders.push(provider);
		}
	}
}
