import { ObjectId } from '@mikro-orm/mongodb';
import { setupEntities } from '@shared/testing';
import { MediaSourceOauthConfig } from '../domain/media-source-oauth-config';
import { MediaSourceConfigEmbeddable } from '../entity/media-source-oauth-config.embeddable';
import { mediaSourceConfigEmbeddableFactory } from '../testing/media-source-config.embeddable.factory';
import { mediaSourceConfigFactory } from '../testing/media-source-config.factory';
import { MediaSourceConfigMapper } from './media-source-config.mapper';

describe('MediaSourceConfigMapper', () => {
	describe('mapToDo', () => {
		describe('when entity is passed', () => {
			const setup = async () => {
				await setupEntities();

				const entity = mediaSourceConfigEmbeddableFactory.build();
				const expected = new MediaSourceOauthConfig({
					id: entity._id.toHexString(),
					clientId: entity.clientId,
					clientSecret: entity.clientSecret,
					authEndpoint: entity.authEndpoint,
					method: entity.method,
				});

				return { entity, expected };
			};

			it('should return an instance of config', async () => {
				const { entity } = await setup();

				const result = MediaSourceConfigMapper.mapToDo(entity);

				expect(result).toBeInstanceOf(MediaSourceOauthConfig);
			});

			it('should return a do with all properties', async () => {
				const { entity, expected } = await setup();

				const result = MediaSourceConfigMapper.mapToDo(entity);

				expect(result).toEqual(expected);
			});
		});
	});

	describe('mapToEntity', () => {
		describe('when config do is passed', () => {
			const setup = async () => {
				await setupEntities();

				const configDo = mediaSourceConfigFactory.build();
				const expected = new MediaSourceConfigEmbeddable({
					_id: new ObjectId(configDo.id),
					clientId: configDo.getProps().clientId,
					clientSecret: configDo.getProps().clientSecret,
					authEndpoint: configDo.getProps().authEndpoint,
					method: configDo.getProps().method,
				});

				return { configDo, expected };
			};

			it('should return an instance of config embeddable', async () => {
				const { configDo } = await setup();

				const result = MediaSourceConfigMapper.mapToEntity(configDo);

				expect(result).toBeInstanceOf(MediaSourceConfigEmbeddable);
			});

			it('should return an embeddable with all properties', async () => {
				const { configDo, expected } = await setup();

				const result = MediaSourceConfigMapper.mapToEntity(configDo);

				expect(result).toEqual(expected);
			});
		});
	});
});
