import { Migration } from '@mikro-orm/migrations-mongodb';

type System = {
	provisioningStrategy: string;
};

export class Migration20250310122000 extends Migration {
	public async up(): Promise<void> {
		await this.getCollection<System>('systems').updateOne(
			{ provisioningStrategy: 'sanis' },
			{
				$set: {
					provisioningStrategy: 'schulconnex-async',
				},
			}
		);

		console.info("Changed provisioning strategy from 'sanis' to 'schulconnex-async'");
	}

	public async down(): Promise<void> {
		await this.getCollection<System>('systems').updateOne(
			{ provisioningStrategy: 'schulconnex-async' },
			{
				$set: {
					provisioningStrategy: 'sanis',
				},
			}
		);

		console.info("Changed provisioning strategy from 'schulconnex-async' to 'sanis'");
	}
}
