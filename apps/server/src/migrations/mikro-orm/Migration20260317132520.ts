import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20260317132520 extends Migration {
	public async up(): Promise<void> {
		console.log('Dropping Rocketchat Collections. WARNING: this can not be rolled back!');

		try {
			await this.getCollection('rocketchatusers').drop();
		} catch (error: unknown) {
			const err = error as { code?: number; codeName?: string; message?: string };
			if (
				err?.code !== 26 &&
				err?.codeName !== 'NamespaceNotFound' &&
				!String(err?.message || '').includes('NamespaceNotFound')
			) {
				throw error;
			}
		}

		try {
			await this.getCollection('rocketchatchannels').drop();
		} catch (error: any) {
			const err = error as { code?: number; codeName?: string; message?: string };
			if (
				err?.code !== 26 &&
				err?.codeName !== 'NamespaceNotFound' &&
				!String(err?.message || '').includes('NamespaceNotFound')
			) {
				throw error;
			}
		}

		await this.getCollection('teams').updateMany(
			{ features: 'rocketChat' },
			{
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore // MongoDB types are wrong here
				$pull: { features: 'rocketChat' },
			}
		);

		await this.getCollection('schools').updateMany(
			{ features: 'rocketChat' },
			{
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore // MongoDB types are wrong here
				$pull: { features: 'rocketChat' },
			}
		);

		console.log('Finished dropping Rocketchat Collections');
	}

	public async down(): Promise<void> {
		console.log('Rocketchat Collections can not be restored. If necessary, restore from backup.');

		return Promise.resolve();
	}
}
