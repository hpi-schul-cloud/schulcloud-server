import { SanisResponseMapper } from '@src/modules/provisioning/strategy/sanis/sanis-response.mapper';
import {
	SanisResponse,
	SanisResponseName,
	SanisResponseOrganisation,
	SanisResponsePersonenkontext,
	SanisRole,
} from '@src/modules/provisioning/strategy/sanis/sanis.response';
import { UUID } from 'bson';
import { RoleName } from '@shared/domain';

describe('SanisResponseMapper', () => {
	let mapper: SanisResponseMapper;

	const userUUID: UUID = new UUID('aef1f4fd-c323-466e-962b-a84354c0e713');
	const schoolUUID: UUID = new UUID('df66c8e6-cfac-40f7-b35b-0da5d8ee680e');
	const sanisResponse: SanisResponse = new SanisResponse({
		pid: userUUID.toString(),
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
				ktid: new UUID(),
				rolle: SanisRole.LERN,
				organisation: new SanisResponseOrganisation({
					orgid: schoolUUID,
					name: 'schoolName',
					typ: 'SCHULE',
				}),
				personenstatus: '',
			}),
		],
	});

	beforeAll(() => {
		mapper = new SanisResponseMapper();
	});

	describe('mapToSchoolDto', () => {
		it('should map a school to Dto', () => {
			const dto = mapper.mapToSchoolDto(sanisResponse);
			expect(dto?.name).toEqual(sanisResponse.personenkontexte[0].organisation.name);
			expect(dto?.externalIdentifier).toEqual(sanisResponse.personenkontexte[0].organisation.orgid.toString());
		});
	});

	describe('mapToUserDto', () => {
		it('should map a user to Dto', () => {
			const schoolId = 'testSchool';
			const dto = mapper.mapToUserDto(sanisResponse, schoolId);
			expect(dto.firstName).toEqual(sanisResponse.person.name.vorname);
			expect(dto.lastName).toEqual(sanisResponse.person.name.familienname);
			expect(dto.schoolId).toEqual(schoolId);
			expect(dto.roleNames[0]).toEqual(RoleName.STUDENT);
			expect(dto.externalId).toStrictEqual(sanisResponse.pid);
		});
	});
});
