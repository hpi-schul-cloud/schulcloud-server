import { CustomParameterLocation, ToolConfigType, ToolLaunchRequestDO } from '@shared/domain';
import { PropertyLocation } from '@shared/domain/domainobject/tool/launch';
import { ToolLaunchDataType } from '@shared/domain/domainobject/tool/launch/tool-launch-data-type';
import { toolLaunchRequestFactory } from '@shared/testing/factory/domainobject/tool/tool-launch-request.factory';
import { ToolLaunchMapper } from './tool-launch.mapper';
import { ToolLaunchRequestResponse } from './tool-launch-request.response';

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
			const toolLaunchRequestDO: ToolLaunchRequestDO = toolLaunchRequestFactory.build();

			const result: ToolLaunchRequestResponse = ToolLaunchMapper.mapToToolLaunchRequestResponse(toolLaunchRequestDO);

			expect(result).toEqual({
				method: toolLaunchRequestDO.method,
				url: toolLaunchRequestDO.url,
				payload: toolLaunchRequestDO.payload,
				openNewTab: toolLaunchRequestDO.openNewTab,
			});
		});
	});
});
