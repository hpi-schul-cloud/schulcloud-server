import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { SchulConneXProvisioningOptionsInterface } from '../interface';
import {
	ProvisioningStrategyInvalidOptionsLoggableException,
	ProvisioningStrategyNoOptionsLoggableException,
} from '../loggable';
import { SchoolSystemOptionsBuilder } from './school-system-options.builder';
import { AnyProvisioningOptions } from './school-system-options.do';
import { SchulConneXProvisioningOptions } from './schulconnex-provisionin-options.do';

describe(SchoolSystemOptionsBuilder.name, () => {
	describe('getDefaultProvisioningOptions', () => {
		describe('when the provisioning strategy has options', () => {
			it('should have the correct options instance', () => {
				const builder: SchoolSystemOptionsBuilder = new SchoolSystemOptionsBuilder(SystemProvisioningStrategy.SANIS);

				const result: AnyProvisioningOptions = builder.getDefaultProvisioningOptions();

				expect(result).toBeInstanceOf(SchulConneXProvisioningOptions);
			});
		});

		describe('when the provisioning strategy has no options', () => {
			it('should throw an error', () => {
				const builder: SchoolSystemOptionsBuilder = new SchoolSystemOptionsBuilder(
					SystemProvisioningStrategy.UNDEFINED
				);

				expect(() => builder.getDefaultProvisioningOptions()).toThrow(ProvisioningStrategyNoOptionsLoggableException);
			});
		});
	});

	describe('buildProvisioningOptions', () => {
		describe('when the provisioning strategy is "SANIS" and the options are valid', () => {
			const setup = () => {
				const options: SchulConneXProvisioningOptionsInterface = {
					groupProvisioningClassesEnabled: true,
					groupProvisioningCoursesEnabled: true,
					groupProvisioningOtherEnabled: true,
					schoolExternalToolProvisioningEnabled: true,
				};

				return {
					options,
				};
			};

			it('should have the correct options instance', () => {
				const { options } = setup();

				const result: AnyProvisioningOptions = new SchoolSystemOptionsBuilder(
					SystemProvisioningStrategy.SANIS
				).buildProvisioningOptions(options);

				expect(result).toBeInstanceOf(SchulConneXProvisioningOptions);
			});

			it('should return the options', () => {
				const { options } = setup();

				const result: AnyProvisioningOptions = new SchoolSystemOptionsBuilder(
					SystemProvisioningStrategy.SANIS
				).buildProvisioningOptions(options);

				expect(result).toEqual(options);
			});
		});

		describe('when the provided options do not fit the strategy', () => {
			it('should throw an error', () => {
				const builder: SchoolSystemOptionsBuilder = new SchoolSystemOptionsBuilder(SystemProvisioningStrategy.SANIS);

				expect(() =>
					builder.buildProvisioningOptions({
						groupProvisioningClassesEnabled: true,
					})
				).toThrow(ProvisioningStrategyInvalidOptionsLoggableException);
			});
		});
	});
});
