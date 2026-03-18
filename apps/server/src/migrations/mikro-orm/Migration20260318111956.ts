import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20260318111956 extends Migration {
	public async up(): Promise<void> {
		console.log('Removing unused collections');

		await this.getCollection('activations').drop();
		await this.getCollection('analytics').drop();
		await this.getCollection('consents').drop();
		await this.getCollection('consents_history').drop();
		await this.getCollection('dashboarddefaultreference').drop();
		await this.getCollection('directories').drop();
		await this.getCollection('keys').drop();
		await this.getCollection('newshistories').drop();
		await this.getCollection('problems').drop();
		await this.getCollection('webuntismetadatas').drop();

		console.log('Finished removing unused collections');
	}
}
