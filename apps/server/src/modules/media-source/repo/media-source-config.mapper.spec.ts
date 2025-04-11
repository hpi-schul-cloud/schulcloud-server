import { MediaSourceOauthConfig, MediaSourceVidisConfig } from '../do';
import { MediaSourceOauthConfigEmbeddable, MediaSourceVidisConfigEmbeddable } from '../entity';
import {
	mediaSourceOAuthConfigEmbeddableFactory,
	mediaSourceOauthConfigFactory,
	mediaSourceVidisConfigEmbeddableFactory,
	mediaSourceVidisConfigFactory,
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
					baseUrl: configDo.baseUrl,
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

	describe('mapVidisToEmbeddable', () => {
		describe('when a basic auth config domain object is passed', () => {
			const setup = () => {
				const domainObject = mediaSourceVidisConfigFactory.build();
				const expected = new MediaSourceVidisConfigEmbeddable({
					username: domainObject.username,
					password: domainObject.password,
					baseUrl: domainObject.baseUrl,
					region: domainObject.region,
					schoolNumberPrefix: domainObject.schoolNumberPrefix,
				});

				return { domainObject, expected };
			};

			it('should return an instance of config embeddable', () => {
				const { domainObject } = setup();

				const result = MediaSourceConfigMapper.mapVidisConfigToEmbeddable(domainObject);

				expect(result).toBeInstanceOf(MediaSourceVidisConfigEmbeddable);
			});

			it('should return an embeddable with all properties', () => {
				const { domainObject, expected } = setup();

				const result = MediaSourceConfigMapper.mapVidisConfigToEmbeddable(domainObject);

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
					baseUrl: embeddable.baseUrl,
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

	describe('mapVidisToDo', () => {
		describe('when a basic auth config embeddable is passed', () => {
			const setup = () => {
				const embeddable = mediaSourceVidisConfigEmbeddableFactory.build();
				const expected = new MediaSourceVidisConfig({
					username: embeddable.username,
					password: embeddable.password,
					baseUrl: embeddable.baseUrl,
					region: embeddable.region,
					schoolNumberPrefix: embeddable.schoolNumberPrefix,
				});

				return { embeddable, expected };
			};

			it('should return an instance of config', () => {
				const { embeddable } = setup();

				const result = MediaSourceConfigMapper.mapVidisConfigToDo(embeddable);

				expect(result).toBeInstanceOf(MediaSourceVidisConfig);
			});

			it('should return a domain object with all properties', () => {
				const { embeddable, expected } = setup();

				const result = MediaSourceConfigMapper.mapVidisConfigToDo(embeddable);

				expect(result).toEqual(expected);
			});
		});
	});
});
