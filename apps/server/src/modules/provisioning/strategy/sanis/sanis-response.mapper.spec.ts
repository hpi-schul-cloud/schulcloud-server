import { createMock } from '@golevelup/ts-jest';
import { GroupTypes } from '@modules/group';
import { Test, TestingModule } from '@nestjs/testing';
import { RoleName } from '@shared/domain/interface';
import { Logger } from '@src/core/logger';
import { UUID } from 'bson';
import { ExternalGroupDto, ExternalSchoolDto, ExternalUserDto } from '../../dto';
import {
	SanisGroupRole,
	SanisGroupType,
	SanisGruppenResponse,
	SanisPersonenkontextResponse,
	SanisResponse,
	SanisRole,
	SanisSonstigeGruppenzugehoerigeResponse,
} from './response';
import { SanisResponseMapper } from './sanis-response.mapper';

describe('SanisResponseMapper', () => {
	let module: TestingModule;
	let mapper: SanisResponseMapper;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SanisResponseMapper,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		mapper = module.get(SanisResponseMapper);
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
				geburt: {
					datum: '2023-11-17',
				},
			},
			personenkontexte: [
				{
					id: new UUID().toString(),
					rolle: SanisRole.LERN,
					organisation: {
						id: new UUID(externalSchoolId).toString(),
						name: 'schoolName',
						kennung: 'NI_123456_NI_ashd3838',
						anschrift: {
							ort: 'Hannover',
						},
					},
					gruppen: [
						{
							gruppe: {
								id: new UUID().toString(),
								bezeichnung: 'bezeichnung',
								typ: SanisGroupType.CLASS,
							},
							gruppenzugehoerigkeit: {
								rollen: [SanisGroupRole.TEACHER],
							},
							sonstige_gruppenzugehoerige: [
								{
									rollen: [SanisGroupRole.STUDENT],
									ktid: 'ktid',
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
					location: 'Hannover',
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
					birthday: new Date('2023-11-17'),
				});
			});
		});
	});

	describe('mapToExternalGroupDtos', () => {
		describe('when no group is given', () => {
			const setup = () => {
				const { sanisResponse } = setupSanisResponse();
				sanisResponse.personenkontexte[0].gruppen = undefined;

				return {
					sanisResponse,
				};
			};

			it('should return undefined', () => {
				const { sanisResponse } = setup();

				const result: ExternalGroupDto[] | undefined = mapper.mapToExternalGroupDtos(sanisResponse);

				expect(result).toBeUndefined();
			});
		});

		describe('when group type class is given', () => {
			const setup = () => {
				const { sanisResponse } = setupSanisResponse();
				const personenkontext: SanisPersonenkontextResponse = sanisResponse.personenkontexte[0];
				const group: SanisGruppenResponse = personenkontext.gruppen![0];
				const otherParticipant: SanisSonstigeGruppenzugehoerigeResponse = group.sonstige_gruppenzugehoerige![0];

				return {
					sanisResponse,
					group,
					personenkontext,
					otherParticipant,
				};
			};

			it('should map the sanis response to external group dtos', () => {
				const { sanisResponse, group, personenkontext, otherParticipant } = setup();

				const result: ExternalGroupDto[] | undefined = mapper.mapToExternalGroupDtos(sanisResponse);

				expect(result?.[0]).toEqual<ExternalGroupDto>({
					name: group.gruppe.bezeichnung,
					type: GroupTypes.CLASS,
					externalId: group.gruppe.id,
					user: {
						externalUserId: personenkontext.id,
						roleName: RoleName.TEACHER,
					},
					otherUsers: [
						{
							externalUserId: otherParticipant.ktid,
							roleName: RoleName.STUDENT,
						},
					],
				});
			});
		});

		describe('when group type other is provided', () => {
			const setup = () => {
				const { sanisResponse } = setupSanisResponse();
				sanisResponse.personenkontexte[0].gruppen![0]!.gruppe.typ = SanisGroupType.OTHER;

				return {
					sanisResponse,
				};
			};

			it('should map the group', () => {
				const { sanisResponse } = setup();

				const result: ExternalGroupDto[] | undefined = mapper.mapToExternalGroupDtos(sanisResponse);

				expect(result).toEqual([
					expect.objectContaining<Partial<ExternalGroupDto>>({
						type: GroupTypes.OTHER,
					}),
				]);
			});
		});

		describe('when group type course is provided', () => {
			const setup = () => {
				const { sanisResponse } = setupSanisResponse();
				sanisResponse.personenkontexte[0].gruppen![0]!.gruppe.typ = SanisGroupType.COURSE;

				return {
					sanisResponse,
				};
			};

			it('should map the group', () => {
				const { sanisResponse } = setup();

				const result: ExternalGroupDto[] | undefined = mapper.mapToExternalGroupDtos(sanisResponse);

				expect(result).toEqual([
					expect.objectContaining<Partial<ExternalGroupDto>>({
						type: GroupTypes.COURSE,
					}),
				]);
			});
		});

		describe('when the group role mapping for the user is missing', () => {
			const setup = () => {
				const { sanisResponse } = setupSanisResponse();
				sanisResponse.personenkontexte[0].gruppen![0]!.gruppenzugehoerigkeit.rollen = [SanisGroupRole.SCHOOL_SUPPORT];

				return {
					sanisResponse,
				};
			};

			it('should not map the group', () => {
				const { sanisResponse } = setup();

				const result: ExternalGroupDto[] | undefined = mapper.mapToExternalGroupDtos(sanisResponse);

				expect(result).toHaveLength(0);
			});
		});

		describe('when the user has no role in the group', () => {
			const setup = () => {
				const { sanisResponse } = setupSanisResponse();
				sanisResponse.personenkontexte[0].gruppen![0]!.gruppenzugehoerigkeit.rollen = [];

				return {
					sanisResponse,
				};
			};

			it('should not map the group', () => {
				const { sanisResponse } = setup();

				const result: ExternalGroupDto[] | undefined = mapper.mapToExternalGroupDtos(sanisResponse);

				expect(result).toHaveLength(0);
			});
		});

		describe('when no other participants are provided', () => {
			const setup = () => {
				const { sanisResponse } = setupSanisResponse();
				sanisResponse.personenkontexte[0].gruppen![0].sonstige_gruppenzugehoerige = undefined;

				return {
					sanisResponse,
				};
			};

			it('should set other users to undefined', () => {
				const { sanisResponse } = setup();

				const result: ExternalGroupDto[] | undefined = mapper.mapToExternalGroupDtos(sanisResponse);

				expect(result?.[0].otherUsers).toBeUndefined();
			});
		});

		describe('when other participants have unknown roles', () => {
			const setup = () => {
				const { sanisResponse } = setupSanisResponse();
				sanisResponse.personenkontexte[0].gruppen![0]!.sonstige_gruppenzugehoerige = [
					{
						ktid: 'ktid',
						rollen: [SanisGroupRole.SCHOOL_SUPPORT],
					},
				];

				return {
					sanisResponse,
				};
			};

			it('should not add the user to other users', () => {
				const { sanisResponse } = setup();

				const result: ExternalGroupDto[] | undefined = mapper.mapToExternalGroupDtos(sanisResponse);

				expect(result?.[0].otherUsers).toHaveLength(0);
			});
		});
	});
});
