import { Migration } from '@mikro-orm/migrations-mongodb';
import * as process from 'node:process';

export class Migration20240604131554 extends Migration {
	async up(): Promise<void> {
		// eslint-disable-next-line no-process-env
		if (process.env.SC_THEME === 'n21') {
			await this.driver.nativeInsert('instances', {
				name: 'nbc',
			});
			console.info('Instance config was added for nbc');
		}

		// eslint-disable-next-line no-process-env
		if (process.env.SC_THEME === 'brb') {
			await this.driver.nativeInsert('instances', {
				name: 'brb',
			});
			console.info('Instance config was added for brb');
		}

		// eslint-disable-next-line no-process-env
		if (process.env.SC_THEME === 'thr') {
			await this.driver.nativeInsert('instances', {
				name: 'thr',
			});
			console.info('Instance config was added for thr');
		}

		// eslint-disable-next-line no-process-env
		if (process.env.SC_THEME === 'default') {
			await this.driver.nativeInsert('instances', {
				name: 'dbc',
			});
			console.info('Instance config was added for default');
		}
	}

	async down(): Promise<void> {
		await this.getCollection('instances').drop();

		console.info('Collection "instance-configs" was dropped');
	}
}
