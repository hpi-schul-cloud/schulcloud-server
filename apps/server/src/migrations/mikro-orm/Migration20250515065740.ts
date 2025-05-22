import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20250318124252 extends Migration {
	public async up(): Promise<void> {
		await this.getCollection('roles').updateOne(
			{ name: 'superhero' },
			{
				$pull: {
					permissions: {
						$in: ['SCHOOL_EDIT_ALL', 'INSTANCE_VIEW'],
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
						$each: ['SCHOOL_VIEW', 'INSTANCE_VIEW'],
					},
				},
			}
		);

		console.info(
			'Added permissions INSTANCE_EDIT, CAN_EXECUTE_INSTANCE_OPERATIONS, SCHOOL_VIEW. Removed SCHOOL_EDIT_ALL. Move INSTANCE_VIEW to user.'
		);
	}

	public async down(): Promise<void> {
		await this.getCollection('roles').updateOne(
			{ name: 'user' },
			{
				$pull: {
					permissions: {
						$in: ['SCHOOL_VIEW', 'INSTANCE_VIEW'],
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
						$each: ['SCHOOL_EDIT_ALL', 'INSTANCE_VIEW'],
					},
				},
			}
		);

		console.info(
			'Rollback: Added permission SCHOOL_EDIT_ALL. Removed INSTANCE_EDIT, CAN_EXECUTE_INSTANCE_OPERATIONS, SCHOOL_VIEW. Move INSTANCE_VIEW to shd.'
		);
	}
}
