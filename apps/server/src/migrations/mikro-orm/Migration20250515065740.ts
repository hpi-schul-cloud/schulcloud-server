import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20250318124252 extends Migration {
	public async up(): Promise<void> {
		await this.getCollection('roles').updateOne(
			{ name: 'superhero' },
			{
				$pull: {
					permissions: {
						$in: ['SCHOOL_EDIT_ALL'],
					},
				},
			}
		);

		await this.getCollection('roles').updateOne(
			{ name: 'superhero' },
			{
				$addToSet: {
					permissions: {
						$each: ['INSTANCE_EDIT', 'CAN_EXECUTE_INSTANCE_OPERATIONS'],
					},
				},
			}
		);

		await this.getCollection('roles').updateOne(
			{ name: 'user' },
			{
				$addToSet: {
					permissions: {
						$each: ['SCHOOL_VIEW'],
					},
				},
			}
		);

		console.info('Added INSTANCE_EDIT, CAN_EXECUTE_INSTANCE_OPERATIONS, SCHOOL_VIEW and remove SCHOOL_EDIT_ALL.');
	}

	public async down(): Promise<void> {
		await this.getCollection('roles').updateOne(
			{ name: 'user' },
			{
				$pull: {
					permissions: {
						$in: ['SCHOOL_VIEW'],
					},
				},
			}
		);

		await this.getCollection('roles').updateOne(
			{ name: 'superhero' },
			{
				$pull: {
					permissions: {
						$in: ['INSTANCE_EDIT', 'CAN_EXECUTE_INSTANCE_OPERATIONS'],
					},
				},
			}
		);

		await this.getCollection('roles').updateOne(
			{ name: 'superhero' },
			{
				$addToSet: {
					permissions: {
						$each: ['SCHOOL_EDIT_ALL'],
					},
				},
			}
		);

		console.info(
			'Rollback: Added SCHOOL_EDIT_ALL and remove INSTANCE_EDIT, CAN_EXECUTE_INSTANCE_OPERATIONS, SCHOOL_VIEW.'
		);
	}
}
