import { CustomParameterType } from '../../enum';
import { ToolParameterTypeValidationUtil } from './tool-parameter-type-validation.util';

describe(ToolParameterTypeValidationUtil.name, () => {
	describe('isValueValidForType', () => {
		describe('when the type is "string"', () => {
			it('should return true', () => {
				const result: boolean = ToolParameterTypeValidationUtil.isValueValidForType(
					CustomParameterType.STRING,
					'12345'
				);

				expect(result).toEqual(true);
			});
		});

		describe('when the type is "number" and the value is a number', () => {
			it('should return true', () => {
				const result: boolean = ToolParameterTypeValidationUtil.isValueValidForType(CustomParameterType.NUMBER, '17');

				expect(result).toEqual(true);
			});
		});

		describe('when the type is "number" and the value is a not a number', () => {
			it('should return false', () => {
				const result: boolean = ToolParameterTypeValidationUtil.isValueValidForType(CustomParameterType.NUMBER, 'NaN');

				expect(result).toEqual(false);
			});
		});

		describe('when the type is "boolean" and the value is a boolean', () => {
			it('should return true', () => {
				const result: boolean = ToolParameterTypeValidationUtil.isValueValidForType(
					CustomParameterType.BOOLEAN,
					'true'
				);

				expect(result).toEqual(true);
			});
		});

		describe('when the type is "boolean" and the value is not a boolean', () => {
			it('should return false', () => {
				const result: boolean = ToolParameterTypeValidationUtil.isValueValidForType(
					CustomParameterType.BOOLEAN,
					'not true'
				);

				expect(result).toEqual(false);
			});
		});

		describe('when the type is AUTO_CONTEXTNAME', () => {
			it('should return false', () => {
				const result: boolean = ToolParameterTypeValidationUtil.isValueValidForType(
					CustomParameterType.AUTO_CONTEXTNAME,
					'any value'
				);

				expect(result).toEqual(false);
			});
		});

		describe('when the type is AUTO_CONTEXTID', () => {
			it('should return false', () => {
				const result: boolean = ToolParameterTypeValidationUtil.isValueValidForType(
					CustomParameterType.AUTO_CONTEXTID,
					'any value'
				);

				expect(result).toEqual(false);
			});
		});

		describe('when the type is AUTO_SCHOOLID', () => {
			it('should return false', () => {
				const result: boolean = ToolParameterTypeValidationUtil.isValueValidForType(
					CustomParameterType.AUTO_SCHOOLID,
					'any value'
				);

				expect(result).toEqual(false);
			});
		});

		describe('when the type is AUTO_SCHOOLNUMBER', () => {
			it('should return false', () => {
				const result: boolean = ToolParameterTypeValidationUtil.isValueValidForType(
					CustomParameterType.AUTO_SCHOOLNUMBER,
					'any value'
				);

				expect(result).toEqual(false);
			});
		});

		describe('when the type is AUTO_MEDIUMID', () => {
			it('should return false', () => {
				const result: boolean = ToolParameterTypeValidationUtil.isValueValidForType(
					CustomParameterType.AUTO_MEDIUMID,
					'any value'
				);

				expect(result).toEqual(false);
			});
		});

		describe('when the type is AUTO_GROUPUUID', () => {
			it('should return false', () => {
				const result: boolean = ToolParameterTypeValidationUtil.isValueValidForType(
					CustomParameterType.AUTO_GROUP_EXTERNALUUID,
					'any value'
				);

				expect(result).toEqual(false);
			});
		});
	});
});
