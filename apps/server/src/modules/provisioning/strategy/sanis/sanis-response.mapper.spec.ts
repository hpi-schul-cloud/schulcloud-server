import { RoleName } from '@shared/domain';
import { UUID } from 'bson';
import { GroupTypes } from '@src/modules/group';
import { ExternalGroupDto, ExternalSchoolDto, ExternalUserDto } from '../../dto';
import { SanisResponseMapper } from './sanis-response.mapper';
import { SanisGroupRole, SanisGroupType, SanisGruppenResponse, SanisResponse, SanisRole } from './response';

describe('SanisResponseMapper', () => {
	let mapper: SanisResponseMapper;

	beforeAll(() => {
		mapper = new SanisResponseMapper();
	});

	const setupSanisResponse = () => {
		const externalUserId = 'aef1f4fd-c323-466e-962b-a84354c0e713';
		const externalSchoolId = 'df66c8e6-cfac-40f7-b35b-0da5d8ee680e';
		const sanisResponse: SanisResponse = {
			pid: externalUserId,
			person: {
				name: {
					vorname: 'firstName',
					familienname: 'lastName',
				},
				geschlecht: 'x',
				lokalisierung: 'de-de',
				vertrauensstufe: '',
			},
			personenkontexte: [
				{
					id: new UUID().toString(),
					rolle: SanisRole.LERN,
					organisation: {
						id: new UUID(externalSchoolId).toString(),
						name: 'schoolName',
						typ: 'SCHULE',
						kennung: 'NI_123456_NI_ashd3838',
					},
					personenstatus: '',
					gruppen: [
						{
							gruppe: {
								id: new UUID().toString(),
								bezeichnung: 'bezeichnung',
								typ: SanisGroupType.CLASS,
								laufzeit: {
									von: new Date(2023, 1, 8),
									bis: new Date(2024, 7, 31),
								},
								orgid: 'orgid',
							},
							gruppenzugehoerigkeiten: [
								{
									id: new UUID().toString(),
									rollen: [SanisGroupRole.CLASS_LEADER],
									ktid: 'ktid',
									von: new Date(2023, 1, 8),
									bis: new Date(2024, 7, 31),
								},
							],
						},
					],
				},
			],
		};

		return {
			externalUserId,
			externalSchoolId,
			sanisResponse,
		};
	};

	describe('mapToExternalSchoolDto', () => {
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

	describe('mapToExternalUserDto', () => {
		describe('when a sanis response is provided', () => {
			it('should map the response to an ExternalUserDto', () => {
				const { sanisResponse, externalUserId } = setupSanisResponse();

				const result: ExternalUserDto = mapper.mapToExternalUserDto(sanisResponse);

				expect(result).toEqual<ExternalUserDto>({
					externalId: externalUserId,
					firstName: 'firstName',
					lastName: 'lastName',
					roles: [RoleName.STUDENT],
				});
			});
		});
	});

	describe('mapToExternalGroupDtos', () => {
		describe('when group type is given', () => {
			const setup = () => {
				const { sanisResponse } = setupSanisResponse();
				const group: SanisGruppenResponse = sanisResponse.personenkontexte[0].gruppen[0];

				return {
					sanisResponse,
					group,
				};
			};

			it('should map the sanis response to external group dtos', () => {
				const { sanisResponse, group } = setup();

				const result: ExternalGroupDto[] = mapper.mapToExternalGroupDtos(sanisResponse);

				expect(result[0]).toEqual<ExternalGroupDto>({
					name: group.gruppe.bezeichnung,
					type: GroupTypes.CLASS,
					externalOrganizationId: group.gruppe.orgid,
					from: group.gruppe.laufzeit.von,
					until: group.gruppe.laufzeit.bis,
					externalId: group.gruppe.id,
					users: [
						{
							externalUserId: group.gruppenzugehoerigkeiten[0].ktid,
							roleName: RoleName.TEACHER,
						},
					],
				});
			});
		});

		describe('when no group type is provided', () => {
			const setup = () => {
				const { sanisResponse } = setupSanisResponse();
				sanisResponse.personenkontexte[0].gruppen[0].gruppe.typ = SanisGroupType.OTHER;

				return {
					sanisResponse,
				};
			};

			it('should return empty array', () => {
				const { sanisResponse } = setup();

				const result: ExternalGroupDto[] = mapper.mapToExternalGroupDtos(sanisResponse);

				expect(result).toHaveLength(0);
			});
		});
	});
});
