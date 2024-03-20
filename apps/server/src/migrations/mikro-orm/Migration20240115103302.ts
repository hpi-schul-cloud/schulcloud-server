import { Migration } from '@mikro-orm/migrations-mongodb';

// remove-undefined-parameters-from-external-tool
export class Migration20240115103302 extends Migration {
	async up(): Promise<void> {
		const contextExternalToolResponse = await this.driver.nativeUpdate(
			'context-external-tools',
			{ $or: [{ 'parameters.value': undefined }, { 'parameters.value': '' }] },
			{ $pull: { parameters: { $or: [{ value: undefined }, { value: '' }] } } }
			// { ctx: this.ctx }
		);

		console.info(`Removed ${contextExternalToolResponse.affectedRows} parameter(s) in context-external-tools`);

		const schoolExternalToolResponse = await this.driver.nativeUpdate(
			'school-external-tools',
			{ $or: [{ 'parameters.value': undefined }, { 'parameters.value': '' }] },
			{ $pull: { parameters: { $or: [{ value: undefined }, { value: '' }] } } }
			// { ctx: this.ctx }
		);

		console.info(`Removed ${schoolExternalToolResponse.affectedRows} parameter(s) in school-external-tools`);
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	async down() {
		console.error('This migration cannot be undone');
	}
}
