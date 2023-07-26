import { externalToolDOFactory } from '@shared/testing';
import { ExternalToolDO } from './external-tool.do';

describe('ExternalToolDO', () => {
	describe('isLti11Config', () => {
		describe('when external tool with config.type Lti11 is given', () => {
			it('should return true', () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.withLti11Config().buildWithId();

				const func = () => ExternalToolDO.isLti11Config(externalToolDO.config);

				expect(func()).toBeTruthy();
			});
		});

		describe('when external tool with config.type Lti11 is not given', () => {
			it('should return false', () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId();

				const func = () => ExternalToolDO.isLti11Config(externalToolDO.config);

				expect(func()).toBeFalsy();
			});
		});
	});

	describe('isOauth2Config', () => {
		describe('when external tool with config.type Oauth2 is given', () => {
			it('should return true', () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.withOauth2Config().buildWithId();

				const func = () => ExternalToolDO.isOauth2Config(externalToolDO.config);

				expect(func()).toBeTruthy();
			});
		});

		describe('when external tool with config.type Oauth2 is not given', () => {
			it('should return false', () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId();

				const func = () => ExternalToolDO.isOauth2Config(externalToolDO.config);

				expect(func()).toBeFalsy();
			});
		});
	});
});
