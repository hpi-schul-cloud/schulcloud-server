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
						// eslint-disable-next-line no-new
						new ExternalTool({
							id: new ObjectId().toHexString(),
							name: 'tool',
							isHidden: false,
							openNewTab: false,
							config: basicToolConfigFactory.build(),
							isDeactivated: false,
							isPreferred: false,
						});
					}).toThrowError();
				});
			});
		});
	});
});
