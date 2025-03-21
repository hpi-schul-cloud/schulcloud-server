import { CustomParameterLocation, ToolConfigType } from '../../common/enum';
import { ToolLaunchRequestResponse } from '../controller/dto';
import { LaunchRequestMethod, LaunchType, PropertyLocation, ToolLaunchDataType, ToolLaunchRequest } from '../types';
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
				launchType: LaunchType.BASIC,
			});

			const result: ToolLaunchRequestResponse = ToolLaunchMapper.mapToToolLaunchRequestResponse(toolLaunchRequest);

			expect(result).toEqual<ToolLaunchRequestResponse>({
				method: toolLaunchRequest.method,
				url: toolLaunchRequest.url,
				payload: toolLaunchRequest.payload,
				openNewTab: toolLaunchRequest.openNewTab,
				launchType: LaunchType.BASIC,
			});
		});
	});
});
