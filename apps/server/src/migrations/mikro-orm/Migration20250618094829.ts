import { Migration } from '@mikro-orm/migrations-mongodb';
import { ObjectID } from 'bson';

type System = {
	_id: ObjectID;
	alias: string;
	oauthConfig: {
		issuer: string;
	};
};
export class Migration20250618094829 extends Migration {
	async up(): Promise<void> {
		const moinSchule = await this.getCollection<System>('systems').findOne({ alias: 'moin.schule' });

		if (!moinSchule) {
			console.log('Could not find moin.schule System');
			return;
		}

		const { issuer } = moinSchule.oauthConfig;
		const url = issuer + '/protocol/openid-connect/logout';

		await this.getCollection('systems').updateOne(
			{ alias: 'moin.schule' },
			{ $set: { oauthConfig: { endSessionEndpoint: url } } }
		);
		console.log('Moin.schule system has been updated - endSessionEndpoint has been added.');
	}

	async down(): Promise<void> {
		const moinSchule = await this.getCollection<System>('systems').findOne({ alias: 'moin.schule' });

		if (!moinSchule) {
			console.log('Could not find moin.schule System');
			return;
		}

		await this.getCollection('systems').updateOne(
			{ alias: 'moin.schule' },
			{ $unset: { oauthConfig: { endSessionEndpoint: true } } }
		);
		console.log('Moin.schule system has been updated - endSessionEndpoint has been removed');
	}
}
