import { externalSchoolDtoFactory } from '@shared/testing/factory';
import { externalGroupDtoFactory } from '@shared/testing/factory/external-group-dto.factory';
import { ExternalGroupDto, ExternalSchoolDto } from '../dto';
import { SchoolForGroupNotFoundLoggable } from './school-for-group-not-found.loggable';

describe('SchoolForGroupNotFoundLoggable', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const externalGroupDto: ExternalGroupDto = externalGroupDtoFactory.build();
			const externalSchoolDto: ExternalSchoolDto = externalSchoolDtoFactory.build();

			const loggable = new SchoolForGroupNotFoundLoggable(externalGroupDto, externalSchoolDto);

			return {
				loggable,
				externalGroupDto,
				externalSchoolDto,
			};
		};

		it('should return a loggable message', () => {
			const { loggable, externalGroupDto, externalSchoolDto } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				message: 'Unable to provision group, since the connected school cannot be found.',
				data: {
					externalGroupId: externalGroupDto.externalId,
					externalOrganizationId: externalSchoolDto.externalId,
				},
			});
		});
	});
});
