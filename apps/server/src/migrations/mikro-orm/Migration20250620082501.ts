import { Migration } from '@mikro-orm/migrations-mongodb';
import { ObjectID } from 'bson';

type System = {
	_id: ObjectID;
	alias: string;
	oauthConfig: {
		provider: string;
	};
};

export class Migration20250620082501 extends Migration {
	public async up(): Promise<void> {
		const moinSchuleSystem = await this.getCollection<System>('systems').findOne({
			alias: 'moin.schule',
		});

		if (!moinSchuleSystem) {
			console.info('Could not find moin.schule system');
			return;
		}

		await this.getCollection('systems').updateOne(
			{ alias: 'moin.schule' },
			{ $set: { 'oauthConfig.provider': 'moin.schule' } }
		);

		console.info('moin.schule system has been updated - provider is renamed from "sanis" to "moin.schule"');
	}

	public async down(): Promise<void> {
		const moinSchuleSystem = await this.getCollection<System>('systems').findOne({
			alias: 'moin.schule',
		});

		if (!moinSchuleSystem) {
			console.info('Could not find moin.schule system');
			return;
		}

		await this.getCollection('systems').updateOne(
			{ alias: 'moin.schule' },
			{ $set: { 'oauthConfig.provider': 'sanis' } }
		);

		console.info('moin.schule system has been updated - provider is renamed back to "sanis"');
	}
}
