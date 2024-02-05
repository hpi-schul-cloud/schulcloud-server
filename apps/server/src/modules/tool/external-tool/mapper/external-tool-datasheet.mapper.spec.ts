import {
	customParameterFactory,
	externalToolFactory,
	userDoFactory,
	externalToolDatasheetTemplateDataFactory,
	externalToolParameterDatasheetTemplateDataFactory,
} from '@shared/testing';
import { UserDO } from '@shared/domain/domainobject';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { ExternalToolDatasheetMapper } from './external-tool-datasheet.mapper';
import {
	ExternalToolDatasheetTemplateData,
	ExternalToolParameterDatasheetTemplateData,
	ExternalToolParameterDatasheetTemplateProperty,
} from '../domain';
import { CustomParameterScope, CustomParameterType, ToolContextType } from '../../common/enum';
import { CustomParameter } from '../../common/domain';

describe(ExternalToolDatasheetMapper.name, () => {
	beforeEach(() => {
		Configuration.set('SC_THEME', 'default');
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('when optional parameters are given', () => {
		const setup = () => {
			const user: UserDO = userDoFactory.build();
			const externalTool = externalToolFactory.withCustomParameters(1, { isOptional: true, isProtected: true }).build({
				isDeactivated: true,
				restrictToContexts: [ToolContextType.COURSE, ToolContextType.BOARD_ELEMENT],
			});
			const datasheet: ExternalToolDatasheetTemplateData = externalToolDatasheetTemplateDataFactory
				.withOptionalProperties()
				.withParameters(1, { properties: 'optional, geschützt' })
				.build({ instance: 'dBildungscloud' });

			return { user, externalTool, datasheet };
		};
		it('should map all parameters correctly', () => {
			const { user, externalTool, datasheet } = setup();

			const mappedData: ExternalToolDatasheetTemplateData =
				ExternalToolDatasheetMapper.mapToExternalToolDatasheetTemplateData(externalTool, user.firstName, user.lastName);

			expect(mappedData).toEqual(datasheet);
		});
	});

	describe('when an oauth2 tool is given', () => {
		const setup = () => {
			const user: UserDO = userDoFactory.build();
			const externalTool = externalToolFactory.withOauth2Config({ skipConsent: true }).build();
			const datasheet: ExternalToolDatasheetTemplateData = externalToolDatasheetTemplateDataFactory
				.asOauth2Tool()
				.build({ instance: 'dBildungscloud' });

			return { user, externalTool, datasheet };
		};
		it('should map oauth2 parameters', () => {
			const { user, externalTool, datasheet } = setup();

			const mappedData: ExternalToolDatasheetTemplateData =
				ExternalToolDatasheetMapper.mapToExternalToolDatasheetTemplateData(externalTool, user.firstName, user.lastName);

			expect(mappedData).toEqual(datasheet);
		});
	});

	describe('when an lti11 tool is given', () => {
		const setup = () => {
			const user: UserDO = userDoFactory.build();
			const externalTool = externalToolFactory.withLti11Config().build();
			const datasheet: ExternalToolDatasheetTemplateData = externalToolDatasheetTemplateDataFactory
				.asLti11Tool()
				.build({ instance: 'dBildungscloud' });

			return { user, externalTool, datasheet };
		};
		it('should map lti11 parameters', () => {
			const { user, externalTool, datasheet } = setup();

			const mappedData: ExternalToolDatasheetTemplateData =
				ExternalToolDatasheetMapper.mapToExternalToolDatasheetTemplateData(externalTool, user.firstName, user.lastName);

			expect(mappedData).toEqual(datasheet);
		});
	});

	describe('when instance is unknown', () => {
		const setup = () => {
			Configuration.set('SC_THEME', 'mockInstance');
			const user: UserDO = userDoFactory.build();
			const externalTool = externalToolFactory.build();
			const datasheet: ExternalToolDatasheetTemplateData = externalToolDatasheetTemplateDataFactory.build({
				instance: 'unbekannt',
			});

			return { user, externalTool, datasheet };
		};
		it('should map correct instance', () => {
			const { user, externalTool, datasheet } = setup();

			const mappedData: ExternalToolDatasheetTemplateData =
				ExternalToolDatasheetMapper.mapToExternalToolDatasheetTemplateData(externalTool, user.firstName, user.lastName);

			expect(mappedData).toEqual(datasheet);
		});
	});

	describe('when instance is brb', () => {
		const setup = () => {
			Configuration.set('SC_THEME', 'brb');
			const user: UserDO = userDoFactory.build();
			const externalTool = externalToolFactory.build();
			const datasheet: ExternalToolDatasheetTemplateData = externalToolDatasheetTemplateDataFactory.build({
				instance: 'Schul-Cloud Brandenburg',
			});

			return { user, externalTool, datasheet };
		};
		it('should map correct instance', () => {
			const { user, externalTool, datasheet } = setup();

			const mappedData: ExternalToolDatasheetTemplateData =
				ExternalToolDatasheetMapper.mapToExternalToolDatasheetTemplateData(externalTool, user.firstName, user.lastName);

			expect(mappedData).toEqual(datasheet);
		});
	});

	describe('when instance is thr', () => {
		const setup = () => {
			Configuration.set('SC_THEME', 'thr');
			const user: UserDO = userDoFactory.build();
			const externalTool = externalToolFactory.build();
			const datasheet: ExternalToolDatasheetTemplateData = externalToolDatasheetTemplateDataFactory.build({
				instance: 'Thüringer Schulcloud',
			});

			return { user, externalTool, datasheet };
		};
		it('should map correct instance', () => {
			const { user, externalTool, datasheet } = setup();

			const mappedData: ExternalToolDatasheetTemplateData =
				ExternalToolDatasheetMapper.mapToExternalToolDatasheetTemplateData(externalTool, user.firstName, user.lastName);

			expect(mappedData).toEqual(datasheet);
		});
	});

	describe('when instance is dbc', () => {
		const setup = () => {
			Configuration.set('SC_THEME', 'default');
			const user: UserDO = userDoFactory.build();
			const externalTool = externalToolFactory.build();
			const datasheet: ExternalToolDatasheetTemplateData = externalToolDatasheetTemplateDataFactory.build({
				instance: 'dBildungscloud',
			});

			return { user, externalTool, datasheet };
		};
		it('should map correct instance', () => {
			const { user, externalTool, datasheet } = setup();

			const mappedData: ExternalToolDatasheetTemplateData =
				ExternalToolDatasheetMapper.mapToExternalToolDatasheetTemplateData(externalTool, user.firstName, user.lastName);

			expect(mappedData).toEqual(datasheet);
		});
	});

	describe('when instance is nbc', () => {
		const setup = () => {
			Configuration.set('SC_THEME', 'n21');
			const user: UserDO = userDoFactory.build();
			const externalTool = externalToolFactory.build();
			const datasheet: ExternalToolDatasheetTemplateData = externalToolDatasheetTemplateDataFactory.build({
				instance: 'Niedersächsische Bildungscloud',
			});

			return { user, externalTool, datasheet };
		};
		it('should map correct instance', () => {
			const { user, externalTool, datasheet } = setup();

			const mappedData: ExternalToolDatasheetTemplateData =
				ExternalToolDatasheetMapper.mapToExternalToolDatasheetTemplateData(externalTool, user.firstName, user.lastName);

			expect(mappedData).toEqual(datasheet);
		});
	});

	describe('when custom parameters have types and scopes', () => {
		const setup = () => {
			const user: UserDO = userDoFactory.build();
			const params: CustomParameter[] = [
				customParameterFactory.build({ type: CustomParameterType.STRING, scope: CustomParameterScope.CONTEXT }),
				customParameterFactory.build({ type: CustomParameterType.BOOLEAN, scope: CustomParameterScope.SCHOOL }),
				customParameterFactory.build({ type: CustomParameterType.NUMBER, scope: CustomParameterScope.GLOBAL }),
				customParameterFactory.build({ type: CustomParameterType.AUTO_SCHOOLNUMBER }),
				customParameterFactory.build({ type: CustomParameterType.AUTO_SCHOOLID }),
				customParameterFactory.build({ type: CustomParameterType.AUTO_CONTEXTID }),
				customParameterFactory.build({ type: CustomParameterType.AUTO_CONTEXTNAME }),
				customParameterFactory.build({ type: undefined, scope: undefined }),
			];
			const externalTool = externalToolFactory.build({ parameters: params });

			const parameters: ExternalToolParameterDatasheetTemplateData[] = [
				externalToolParameterDatasheetTemplateDataFactory.build({
					type: 'Zeichenkette',
					scope: 'Kontext',
					properties: ExternalToolParameterDatasheetTemplateProperty.MANDATORY,
				}),
				externalToolParameterDatasheetTemplateDataFactory.build({
					type: 'Wahrheitswert',
					scope: 'Schule',
					properties: ExternalToolParameterDatasheetTemplateProperty.MANDATORY,
				}),
				externalToolParameterDatasheetTemplateDataFactory.build({
					type: 'Zahl',
					scope: 'Global',
					properties: ExternalToolParameterDatasheetTemplateProperty.MANDATORY,
				}),
				externalToolParameterDatasheetTemplateDataFactory.build({
					type: 'Auto Schulnummer',
					properties: ExternalToolParameterDatasheetTemplateProperty.MANDATORY,
				}),
				externalToolParameterDatasheetTemplateDataFactory.build({
					type: 'Auto Schul-ID',
					properties: ExternalToolParameterDatasheetTemplateProperty.MANDATORY,
				}),
				externalToolParameterDatasheetTemplateDataFactory.build({
					type: 'Auto Kontext-ID',
					properties: ExternalToolParameterDatasheetTemplateProperty.MANDATORY,
				}),
				externalToolParameterDatasheetTemplateDataFactory.build({
					type: 'Auto Kontext-Name',
					properties: ExternalToolParameterDatasheetTemplateProperty.MANDATORY,
				}),
				externalToolParameterDatasheetTemplateDataFactory.build({
					type: 'unbekannt',
					scope: 'unbekannt',
					properties: ExternalToolParameterDatasheetTemplateProperty.MANDATORY,
				}),
			];
			const datasheet: ExternalToolDatasheetTemplateData = externalToolDatasheetTemplateDataFactory.build({
				parameters,
			});

			return { user, externalTool, datasheet };
		};
		it('should map all parameters correctly', () => {
			const { user, externalTool, datasheet } = setup();

			const mappedData: ExternalToolDatasheetTemplateData =
				ExternalToolDatasheetMapper.mapToExternalToolDatasheetTemplateData(externalTool, user.firstName, user.lastName);

			expect(mappedData).toEqual(datasheet);
		});
	});
});
