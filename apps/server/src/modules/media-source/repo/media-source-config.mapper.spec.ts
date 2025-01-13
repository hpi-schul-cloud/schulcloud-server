import { MediaSourceBasicAuthConfig, MediaSourceOauthConfig } from '../domain';
import { MediaSourceBasicAuthConfigEmbeddable, MediaSourceOauthConfigEmbeddable } from '../entity';
import {
	mediaSourceBasicAuthConfigFactory,
	mediaSourceOauthConfigFactory,
	mediaSourceBasicConfigEmbeddableFactory,
	mediaSourceOAuthConfigEmbeddableFactory,
} from '../testing';
import { MediaSourceConfigMapper } from './media-source-config.mapper';

describe('MediaSourceConfigMapper', () => {
	describe('mapOauthConfigToEmbeddable', () => {
		describe('when an oauth config domain object is passed', () => {
			const setup = () => {
				const configDo = mediaSourceOauthConfigFactory.build();
				const expected = new MediaSourceOauthConfigEmbeddable({
					clientId: configDo.clientId,
					clientSecret: configDo.clientSecret,
					authEndpoint: configDo.authEndpoint,
					method: configDo.method,
				});

				return { configDo, expected };
			};

			it('should return an instance of config embeddable', () => {
				const { configDo } = setup();

				const result = MediaSourceConfigMapper.mapOauthConfigToEmbeddable(configDo);

				expect(result).toBeInstanceOf(MediaSourceOauthConfigEmbeddable);
			});

			it('should return an embeddable with all properties', () => {
				const { configDo, expected } = setup();

				const result = MediaSourceConfigMapper.mapOauthConfigToEmbeddable(configDo);

				expect(result).toEqual(expected);
			});
		});
	});

	describe('mapBasicAuthConfigToEmbeddable', () => {
		describe('when a basic auth config domain object is passed', () => {
			const setup = () => {
				const domainObject = mediaSourceBasicAuthConfigFactory.build();
				const expected = new MediaSourceBasicAuthConfigEmbeddable({
					username: domainObject.username,
					password: domainObject.password,
					authEndpoint: domainObject.authEndpoint,
				});

				return { domainObject, expected };
			};

			it('should return an instance of config embeddable', () => {
				const { domainObject } = setup();

				const result = MediaSourceConfigMapper.mapBasicAuthConfigToEmbeddable(domainObject);

				expect(result).toBeInstanceOf(MediaSourceBasicAuthConfigEmbeddable);
			});

			it('should return an embeddable with all properties', () => {
				const { domainObject, expected } = setup();

				const result = MediaSourceConfigMapper.mapBasicAuthConfigToEmbeddable(domainObject);

				expect(result).toEqual(expected);
			});
		});
	});

	describe('mapOauthConfigToDo', () => {
		describe('when an oauth config embeddable is passed', () => {
			const setup = () => {
				const embeddable = mediaSourceOAuthConfigEmbeddableFactory.build();
				const expected = new MediaSourceOauthConfig({
					clientId: embeddable.clientId,
					clientSecret: embeddable.clientSecret,
					authEndpoint: embeddable.authEndpoint,
					method: embeddable.method,
				});

				return { embeddable, expected };
			};

			it('should return an instance of config', () => {
				const { embeddable } = setup();

				const result = MediaSourceConfigMapper.mapOauthConfigToDo(embeddable);

				expect(result).toBeInstanceOf(MediaSourceOauthConfig);
			});

			it('should return a domain object with all properties', () => {
				const { embeddable, expected } = setup();

				const result = MediaSourceConfigMapper.mapOauthConfigToDo(embeddable);

				expect(result).toEqual(expected);
			});
		});
	});

	describe('mapBasicAuthConfigToDo', () => {
		describe('when a basic auth config embeddable is passed', () => {
			const setup = () => {
				const embeddable = mediaSourceBasicConfigEmbeddableFactory.build();
				const expected = new MediaSourceBasicAuthConfig({
					username: embeddable.username,
					password: embeddable.password,
					authEndpoint: embeddable.authEndpoint,
				});

				return { embeddable, expected };
			};

			it('should return an instance of config', () => {
				const { embeddable } = setup();

				const result = MediaSourceConfigMapper.mapBasicAuthConfigToDo(embeddable);

				expect(result).toBeInstanceOf(MediaSourceBasicAuthConfig);
			});

			it('should return a domain object with all properties', () => {
				const { embeddable, expected } = setup();

				const result = MediaSourceConfigMapper.mapBasicAuthConfigToDo(embeddable);

				expect(result).toEqual(expected);
			});
		});
	});
});
