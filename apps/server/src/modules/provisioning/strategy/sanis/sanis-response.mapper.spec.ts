import { RoleName } from '@shared/domain';
import { UUID } from 'bson';
import { ExternalSchoolDto, ExternalUserDto } from '../../dto';
import { SanisResponseMapper } from './sanis-response.mapper';
import {
	SanisResponse,
	SanisResponseName,
	SanisResponseOrganisation,
	SanisResponsePersonenkontext,
	SanisRole,
} from './sanis.response';

describe('SanisResponseMapper', () => {
	let mapper: SanisResponseMapper;

	beforeAll(() => {
		mapper = new SanisResponseMapper();
	});

	const setupSanisResponse = () => {
		const externalUserId = 'aef1f4fd-c323-466e-962b-a84354c0e713';
		const externalSchoolId = 'df66c8e6-cfac-40f7-b35b-0da5d8ee680e';
		const sanisResponse: SanisResponse = new SanisResponse({
			pid: externalUserId,
			person: {
				name: new SanisResponseName({
					vorname: 'firstName',
					familienname: 'lastName',
				}),
				geschlecht: 'x',
				lokalisierung: 'de-de',
				vertrauensstufe: '',
			},
			personenkontexte: [
				new SanisResponsePersonenkontext({
					id: new UUID(),
					rolle: SanisRole.LERN,
					organisation: new SanisResponseOrganisation({
						id: new UUID(externalSchoolId),
						name: 'schoolName',
						typ: 'SCHULE',
						kennung: 'NI_123456_NI_ashd3838',
					}),
					personenstatus: '',
					email: 'test@te.st',
				}),
			],
		});

		return {
			externalUserId,
			externalSchoolId,
			sanisResponse,
		};
	};

	describe('mapToExternalSchoolDto is called', () => {
		describe('when a sanis response is provided', () => {
			it('should map the response to an ExternalSchoolDto', () => {
				const { sanisResponse, externalSchoolId } = setupSanisResponse();

				const result: ExternalSchoolDto = mapper.mapToExternalSchoolDto(sanisResponse);

				expect(result).toEqual<ExternalSchoolDto>({
					externalId: externalSchoolId,
					name: 'schoolName',
					officialSchoolNumber: '123456_NI_ashd3838',
				});
			});
		});
	});

	describe('mapToExternalUserDto is called', () => {
		describe('when a sanis response is provided', () => {
			it('should map the response to an ExternalUserDto', () => {
				const { sanisResponse, externalUserId } = setupSanisResponse();

				const result: ExternalUserDto = mapper.mapToExternalUserDto(sanisResponse);

				expect(result).toEqual<ExternalUserDto>({
					externalId: externalUserId,
					firstName: 'firstName',
					lastName: 'lastName',
					email: 'test@te.st',
					roles: [RoleName.STUDENT],
				});
			});
		});
	});
});
