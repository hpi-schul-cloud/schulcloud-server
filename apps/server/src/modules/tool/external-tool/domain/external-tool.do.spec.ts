import { ObjectId } from '@mikro-orm/mongodb';
import { basicToolConfigFactory, externalToolFactory } from '../testing';
import { ExternalTool } from './external-tool.do';

describe(ExternalTool.name, () => {
	describe('isLti11Config', () => {
		describe('when external tool with config.type Lti11 is given', () => {
			it('should return true', () => {
				const externalTool: ExternalTool = externalToolFactory.withLti11Config().buildWithId();

				const func = () => ExternalTool.isLti11Config(externalTool.config);

				expect(func()).toBeTruthy();
			});
		});

		describe('when external tool with config.type Lti11 is not given', () => {
			it('should return false', () => {
				const externalTool: ExternalTool = externalToolFactory.buildWithId();

				const func = () => ExternalTool.isLti11Config(externalTool.config);

				expect(func()).toBeFalsy();
			});
		});
	});

	describe('isOauth2Config', () => {
		describe('when external tool with config.type Oauth2 is given', () => {
			it('should return true', () => {
				const externalTool: ExternalTool = externalToolFactory.withOauth2Config().buildWithId();

				const func = () => ExternalTool.isOauth2Config(externalTool.config);

				expect(func()).toBeTruthy();
			});
		});

		describe('when external tool with config.type Oauth2 is not given', () => {
			it('should return false', () => {
				const externalTool: ExternalTool = externalToolFactory.buildWithId();

				const func = () => ExternalTool.isOauth2Config(externalTool.config);

				expect(func()).toBeFalsy();
			});
		});

		describe('when creating an instance', () => {
			describe('with invalid config type', () => {
				it('should throw an error', () => {
					jest.spyOn(ExternalTool, 'isBasicConfig').mockReturnValueOnce(false);
					jest.spyOn(ExternalTool, 'isOauth2Config').mockReturnValueOnce(false);
					jest.spyOn(ExternalTool, 'isLti11Config').mockReturnValueOnce(false);

					expect(() => {
						new ExternalTool({
							id: new ObjectId().toHexString(),
							name: 'tool',
							isHidden: false,
							openNewTab: false,
							config: basicToolConfigFactory.build(),
							isDeactivated: false,
							isPreferred: false,
						});
					}).toThrow();
				});
			});
		});
	});

	describe('medium identity', () => {
		it('should treat a tool without a mediumId as a non-medium tool', () => {
			const externalTool = externalToolFactory.withMedium({ mediumId: undefined }).buildWithId();

			expect(externalTool.isMediaTool()).toBe(false);
			expect(externalTool.isNonMediaTool()).toBe(true);
		});

		it('should identify medium tools by mediumId and mediaSourceId', () => {
			const firstTool = externalToolFactory
				.withMedium({ mediumId: 'medium-1', mediaSourceId: 'source-1' })
				.buildWithId();
			const sameIdentity = externalToolFactory
				.withMedium({ mediumId: 'medium-1', mediaSourceId: 'source-1' })
				.buildWithId();
			const differentSource = externalToolFactory
				.withMedium({ mediumId: 'medium-1', mediaSourceId: 'source-2' })
				.buildWithId();

			expect(firstTool.hasSameMediumIdentity(sameIdentity)).toBe(true);
			expect(firstTool.hasSameMediumIdentity(differentSource)).toBe(false);
		});
	});
});
