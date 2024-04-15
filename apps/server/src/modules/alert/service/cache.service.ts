import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AlertConfig } from '../config';
import { StatusAdapter } from '../adapter';
import { Message } from '../controller/dto';

@Injectable()
export class CacheService {
	private time: number;

	private lastUpdatedTimestamp = 0;

	private messages: Message[] = [];

	private messageProviders: StatusAdapter[] = [];

	private instance: string;

	constructor(
		private readonly configService: ConfigService<AlertConfig, true>,
		private readonly statusAdapter: StatusAdapter
	) {
		if (configService.get('ALERT_STATUS_URL')) {
			this.addMessageProvider(statusAdapter, true);
		}
		this.instance = configService.get<string>('INSTANCE');
		this.time = 1;
	}

	public updateMessages() {
		let success = false;
		let newMessages: Message[] = [];
		this.lastUpdatedTimestamp = Date.now();

		this.messageProviders.map(async (provider) => {
			const data = await provider.getMessage(this.instance);
			if (!data.success) {
				success = false;
				return;
			}
			newMessages = newMessages.concat(data.messages);
			success = true;
		});

		if (success) {
			this.messages = newMessages;
		}
	}

	public getMessages() {
		if (this.lastUpdatedTimestamp < Date.now() - 1000 * 60 * this.time) {
			this.updateMessages();
		}

		return this.messages || [];
	}

	public addMessageProvider(provider: StatusAdapter, featureEnabled: boolean) {
		if (featureEnabled) {
			this.messageProviders.push(provider);
		}
	}
}
