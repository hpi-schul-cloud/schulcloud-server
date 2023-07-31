import { externalToolDOFactory } from '@shared/testing';
import { ExternalTool } from './external-tool.do';

describe('ExternalToolDO', () => {
	describe('isLti11Config', () => {
		describe('when external tool with config.type Lti11 is given', () => {
			it('should return true', () => {
				const externalToolDO: ExternalTool = externalToolDOFactory.withLti11Config().buildWithId();

				const func = () => ExternalTool.isLti11Config(externalToolDO.config);

				expect(func()).toBeTruthy();
			});
		});

		describe('when external tool with config.type Lti11 is not given', () => {
			it('should return false', () => {
				const externalToolDO: ExternalTool = externalToolDOFactory.buildWithId();

				const func = () => ExternalTool.isLti11Config(externalToolDO.config);

				expect(func()).toBeFalsy();
			});
		});
	});

	describe('isOauth2Config', () => {
		describe('when external tool with config.type Oauth2 is given', () => {
			it('should return true', () => {
				const externalToolDO: ExternalTool = externalToolDOFactory.withOauth2Config().buildWithId();

				const func = () => ExternalTool.isOauth2Config(externalToolDO.config);

				expect(func()).toBeTruthy();
			});
		});

		describe('when external tool with config.type Oauth2 is not given', () => {
			it('should return false', () => {
				const externalToolDO: ExternalTool = externalToolDOFactory.buildWithId();

				const func = () => ExternalTool.isOauth2Config(externalToolDO.config);

				expect(func()).toBeFalsy();
			});
		});
	});
});
