import { ObjectId } from '@mikro-orm/mongodb';
import { ToolContextType } from '../../common/enum';
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
						});
					}).toThrowError();
				});
			});
		});
	});

	describe('getUnrestrictedContexts', () => {
		describe('when the external tool object has restricted contexts', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.buildWithId({
					restrictToContexts: [ToolContextType.MEDIA_BOARD, ToolContextType.BOARD_ELEMENT],
				});

				const unrestrictedContexts: ToolContextType[] = [ToolContextType.COURSE];

				return {
					externalTool,
					unrestrictedContexts,
				};
			};

			it('should return all contexts excluding the restricted ones', () => {
				const { externalTool, unrestrictedContexts } = setup();

				const result = externalTool.getUnrestrictedContexts();

				expect(result).toEqual(expect.arrayContaining(unrestrictedContexts));
			});
		});

		describe('when the external tool object has undefined restricted contexts', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.buildWithId({
					restrictToContexts: undefined,
				});

				const unrestrictedContexts: ToolContextType[] = [
					ToolContextType.MEDIA_BOARD,
					ToolContextType.BOARD_ELEMENT,
					ToolContextType.COURSE,
				];

				return {
					externalTool,
					unrestrictedContexts,
				};
			};

			it('should return all contexts excluding the restricted ones', () => {
				const { externalTool, unrestrictedContexts } = setup();

				const result = externalTool.getUnrestrictedContexts();

				expect(result).toEqual(expect.arrayContaining(unrestrictedContexts));
			});
		});
	});
});
