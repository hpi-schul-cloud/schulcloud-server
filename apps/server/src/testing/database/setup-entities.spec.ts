import { Entity, Property } from '@mikro-orm/decorators/legacy';
import { MongoDriver } from '@mikro-orm/mongodb';
import { BaseEntity } from '@shared/domain/entity';
import { execFileSync } from 'node:child_process';
import { setupEntities } from './setup-entities';

@Entity()
class MetadataTestEntity extends BaseEntity {
	@Property()
	name!: string;
}

describe('setupEntities', () => {
	it('should load reflection support through legacy decorators in a fresh Node process', () => {
		const output = execFileSync(
			process.execPath,
			[
				'--input-type=module',
				'--eval',
				`
					import assert from 'node:assert/strict';
					assert.equal(typeof Reflect.getMetadata, 'undefined');
					await import('@mikro-orm/decorators/legacy');
					assert.equal(typeof Reflect.metadata, 'function');
					assert.equal(typeof Reflect.getMetadata, 'function');
				`,
			],
			{ encoding: 'utf8' }
		);

		expect(output).toBe('');
	});

	it('should discover reflected property types without connecting to a database', async () => {
		const connectSpy = jest.spyOn(MongoDriver.prototype, 'connect');

		try {
			const orm = await setupEntities([MetadataTestEntity]);

			try {
				const metadata = orm.getMetadata().get(MetadataTestEntity);

				expect(Reflect.getMetadata('design:type', MetadataTestEntity.prototype, 'name')).toBe(String);
				expect(metadata.properties.name.type).toBe('string');
				expect(metadata.primaryKeys).toEqual(['_id']);
				expect(orm.em.create(MetadataTestEntity, { name: 'from metadata' }).name).toBe('from metadata');
				expect(connectSpy).not.toHaveBeenCalled();
				expect(await orm.isConnected()).toBe(false);
			} finally {
				await orm.close();
			}
		} finally {
			connectSpy.mockRestore();
		}
	});
});
