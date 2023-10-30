import { CustomParameterLocation } from '../../common/enum/custom-parameter-location.enum';
import { ToolConfigType } from '../../common/enum/tool-config-type.enum';
import { ToolLaunchRequestResponse } from '../controller/dto/tool-launch-request.response';
import { LaunchRequestMethod } from '../types/launch-request-method';
import { PropertyLocation } from '../types/property-location';
import { ToolLaunchDataType } from '../types/tool-launch-data-type';
import { ToolLaunchRequest } from '../types/tool-launch-request';
import { ToolLaunchMapper } from './tool-launch.mapper';

describe('ToolLaunchMapper', () => {
	describe('mapToParameterLocation', () => {
		it('should map CustomParameterLocation to ParameterLocation', () => {
			const location = CustomParameterLocation.PATH;
			const expected = PropertyLocation.PATH;

			const result = ToolLaunchMapper.mapToParameterLocation(location);

			expect(result).toBe(expected);
		});
	});

	describe('mapToToolLaunchDataType', () => {
		it('should map ToolConfigType to ToolLaunchDataType', () => {
			const configType = ToolConfigType.BASIC;
			const expected = ToolLaunchDataType.BASIC;

			const result = ToolLaunchMapper.mapToToolLaunchDataType(configType);

			expect(result).toBe(expected);
		});
	});

	describe('mapToToolLaunchRequestResponse', () => {
		it('should map ToolLaunchRequestDO to ToolLaunchRequestResponse', () => {
			const toolLaunchRequest: ToolLaunchRequest = new ToolLaunchRequest({
				method: LaunchRequestMethod.GET,
				url: 'url',
				openNewTab: true,
				payload: 'payload',
			});

			const result: ToolLaunchRequestResponse = ToolLaunchMapper.mapToToolLaunchRequestResponse(toolLaunchRequest);

			expect(result).toEqual({
				method: toolLaunchRequest.method,
				url: toolLaunchRequest.url,
				payload: toolLaunchRequest.payload,
				openNewTab: toolLaunchRequest.openNewTab,
			});
		});
	});
});
