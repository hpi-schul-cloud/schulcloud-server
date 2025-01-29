import { Migration } from '@mikro-orm/migrations-mongodb';

type System = { provisioningStrategy?: string };

export class Migration20250129150658 extends Migration {
	public async up(): Promise<void> {
		await this.getCollection<System>('systems').updateMany(
			{
				provisioningStrategy: 'sanis',
			},
			{
				$set: { provisioningStrategy: 'schulconnex-async' },
			}
		);

		console.info('Changed all provisioning strategies from "sanis" to "schulconnex-async"');
	}

	public async down(): Promise<void> {
		await this.getCollection<System>('systems').updateMany(
			{
				provisioningStrategy: 'schulconnex-async',
			},
			{
				$set: { provisioningStrategy: 'sanis' },
			}
		);

		console.info('Reset all provisioning strategies from "schulconnex-async" to "sanis"');
	}
}
