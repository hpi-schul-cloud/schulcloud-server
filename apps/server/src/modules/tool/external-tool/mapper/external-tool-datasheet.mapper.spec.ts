import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { School } from '@modules/school';
import { schoolFactory } from '@modules/school/testing';
import { SchoolExternalTool } from '@modules/tool/school-external-tool/domain';
import { UserDO } from '@shared/domain/domainobject';
import {
	customParameterFactory,
	externalToolDatasheetTemplateDataFactory,
	externalToolFactory,
	externalToolParameterDatasheetTemplateDataFactory,
	schoolExternalToolFactory,
	userDoFactory,
} from '@shared/testing';
import { CustomParameter } from '../../common/domain';
import { CustomParameterScope, CustomParameterType, ToolContextType } from '../../common/enum';
import {
	ExternalToolDatasheetTemplateData,
	ExternalToolParameterDatasheetTemplateData,
	ExternalToolParameterDatasheetTemplateProperty,
} from '../domain';
import { ExternalToolDatasheetMapper } from './external-tool-datasheet.mapper';

describe(ExternalToolDatasheetMapper.name, () => {
	beforeEach(() => {
		Configuration.set('SC_TITLE', 'dBildungscloud');
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
			const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build({
				status: { isDeactivated: true },
			});
			const expectDatasheet: ExternalToolDatasheetTemplateData = externalToolDatasheetTemplateDataFactory
				.withOptionalProperties()
				.withParameters(1, { properties: 'optional, geschützt' })
				.build({ instance: 'dBildungscloud' });

			return { user, externalTool, schoolExternalTool, expectDatasheet };
		};

		it('should map all parameters correctly', () => {
			const { user, externalTool, schoolExternalTool, expectDatasheet } = setup();

			const mappedData: ExternalToolDatasheetTemplateData =
				ExternalToolDatasheetMapper.mapToExternalToolDatasheetTemplateData(
					externalTool,
					user.firstName,
					user.lastName,
					schoolExternalTool
				);

			expect(mappedData).toEqual(expectDatasheet);
		});
	});

	describe('when tool is deactivated on school level', () => {
		const setup = () => {
			const user: UserDO = userDoFactory.build();
			const school: School = schoolFactory.build();
			const externalTool = externalToolFactory.build();
			const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build({
				status: { isDeactivated: true },
			});
			const expectDatasheet: ExternalToolDatasheetTemplateData = externalToolDatasheetTemplateDataFactory.build({
				instance: 'dBildungscloud',
				isDeactivated: 'Das Tool ist deaktiviert',
				schoolName: school.getInfo().name,
			});

			return { user, externalTool, schoolExternalTool, expectDatasheet, school };
		};

		it('should map all parameters correctly', () => {
			const { user, externalTool, schoolExternalTool, expectDatasheet, school } = setup();

			const mappedData: ExternalToolDatasheetTemplateData =
				ExternalToolDatasheetMapper.mapToExternalToolDatasheetTemplateData(
					externalTool,
					user.firstName,
					user.lastName,
					schoolExternalTool,
					school.getInfo().name
				);

			expect(mappedData).toEqual(expectDatasheet);
		});
	});

	describe('when an oauth2 tool is given', () => {
		const setup = () => {
			const user: UserDO = userDoFactory.build();
			const externalTool = externalToolFactory.withOauth2Config({ skipConsent: true }).build();
			const expectDatasheet: ExternalToolDatasheetTemplateData = externalToolDatasheetTemplateDataFactory
				.asOauth2Tool()
				.build({ instance: 'dBildungscloud' });

			return { user, externalTool, expectDatasheet };
		};
		it('should map oauth2 parameters', () => {
			const { user, externalTool, expectDatasheet } = setup();

			const mappedData: ExternalToolDatasheetTemplateData =
				ExternalToolDatasheetMapper.mapToExternalToolDatasheetTemplateData(
					externalTool,
					user.firstName,
					user.lastName,
					undefined
				);

			expect(mappedData).toEqual(expectDatasheet);
		});
	});

	describe('when an lti11 tool is given', () => {
		const setup = () => {
			const user: UserDO = userDoFactory.build();
			const externalTool = externalToolFactory.withLti11Config().build();
			const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
			const expectDatasheet: ExternalToolDatasheetTemplateData = externalToolDatasheetTemplateDataFactory
				.asLti11Tool()
				.build({ instance: 'dBildungscloud' });

			return { user, externalTool, schoolExternalTool, expectDatasheet };
		};
		it('should map lti11 parameters', () => {
			const { user, externalTool, schoolExternalTool, expectDatasheet } = setup();

			const mappedData: ExternalToolDatasheetTemplateData =
				ExternalToolDatasheetMapper.mapToExternalToolDatasheetTemplateData(
					externalTool,
					user.firstName,
					user.lastName,
					schoolExternalTool
				);

			expect(mappedData).toEqual(expectDatasheet);
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
				customParameterFactory.build({ type: CustomParameterType.AUTO_MEDIUMID }),
				customParameterFactory.build({ type: undefined, scope: undefined }),
			];
			const externalTool = externalToolFactory.build({ parameters: params });
			const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();

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
					type: 'Auto Medium-ID',
					properties: ExternalToolParameterDatasheetTemplateProperty.MANDATORY,
				}),
				externalToolParameterDatasheetTemplateDataFactory.build({
					type: 'unbekannt',
					scope: 'unbekannt',
					properties: ExternalToolParameterDatasheetTemplateProperty.MANDATORY,
				}),
			];
			const expectDatasheet: ExternalToolDatasheetTemplateData = externalToolDatasheetTemplateDataFactory.build({
				parameters,
			});

			return { user, externalTool, schoolExternalTool, expectDatasheet };
		};
		it('should map all parameters correctly', () => {
			const { user, externalTool, schoolExternalTool, expectDatasheet } = setup();

			const mappedData: ExternalToolDatasheetTemplateData =
				ExternalToolDatasheetMapper.mapToExternalToolDatasheetTemplateData(
					externalTool,
					user.firstName,
					user.lastName,
					schoolExternalTool
				);

			expect(mappedData).toEqual(expectDatasheet);
		});
	});
});
