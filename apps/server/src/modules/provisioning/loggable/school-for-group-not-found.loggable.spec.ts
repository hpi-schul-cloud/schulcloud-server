import { externalGroupDtoFactory } from '@shared/testing/factory/external-group-dto.factory';
import { ExternalGroupDto } from '../dto';
import { SchoolForGroupNotFoundLoggable } from './school-for-group-not-found.loggable';

describe('SchoolForGroupNotFoundLoggable', () => {
	describe('constructor', () => {
		const setup = () => {
			const externalGroupDto: ExternalGroupDto = externalGroupDtoFactory.build();

			return { externalGroupDto };
		};

		it('should create an instance of UserForGroupNotFoundLoggable', () => {
			const { externalGroupDto } = setup();

			const loggable = new SchoolForGroupNotFoundLoggable(externalGroupDto);

			expect(loggable).toBeInstanceOf(SchoolForGroupNotFoundLoggable);
		});
	});

	describe('getLogMessage', () => {
		const setup = () => {
			const externalGroupDto: ExternalGroupDto = externalGroupDtoFactory.build();

			const loggable = new SchoolForGroupNotFoundLoggable(externalGroupDto);

			return { loggable, externalGroupDto };
		};

		it('should return a loggable message', () => {
			const { loggable, externalGroupDto } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				message: 'Unable to provision group, since the connected school cannot be found.',
				data: {
					externalGroupId: externalGroupDto.externalId,
					externalOrganizationId: externalGroupDto.externalOrganizationId,
				},
			});
		});
	});
});
