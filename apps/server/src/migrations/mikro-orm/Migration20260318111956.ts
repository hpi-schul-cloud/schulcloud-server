import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20260318111956 extends Migration {
	public async up(): Promise<void> {
		console.log('Removing unused collections');

		await this.getCollection('activations').drop();
		await this.getCollection('analytics').drop();
		await this.getCollection('column-board-target').drop();
		await this.getCollection('consents').drop();
		await this.getCollection('consents_history').drop();
		await this.getCollection('course_external_tools').drop();
		await this.getCollection('dashboarddefaultreference').drop();
		await this.getCollection('directories').drop();
		await this.getCollection('drawings').drop();
		await this.getCollection('external-tool-config').drop();
		await this.getCollection('external-tool-config-entity').drop();
		await this.getCollection('filepermissionmodels').drop();
		await this.getCollection('keys').drop();
		await this.getCollection('ltitools').drop();
		await this.getCollection('newshistories').drop();
		await this.getCollection('nexboardcontents').drop();
		await this.getCollection('problems').drop();
		await this.getCollection('pseudonyms').drop();
		await this.getCollection('room-members').drop();
		await this.getCollection('trashbins').drop();
		await this.getCollection('user-school-embeddable').drop();
		await this.getCollection('user-source-options-entity').drop();
		await this.getCollection('webuntismetadatas').drop();

		console.log('Finished removing unused collections');
	}
}
