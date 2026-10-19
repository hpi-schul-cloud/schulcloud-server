import { Entity, Property } from '@mikro-orm/decorators/legacy';
import { MongoDriver } from '@mikro-orm/mongodb';
import { BaseEntity } from '@shared/domain/entity';
import { setupEntities } from './setup-entities';

@Entity()
class MetadataTestEntity extends BaseEntity {
	@Property()
	name = 'test';
}

describe('setupEntities', () => {
	it('should discover reflected property types without connecting to a database', async () => {
		const connectSpy = jest.spyOn(MongoDriver.prototype, 'connect');

		try {
			const orm = await setupEntities([MetadataTestEntity]);

			try {
				const metadata = orm.getMetadata().get(MetadataTestEntity);

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
