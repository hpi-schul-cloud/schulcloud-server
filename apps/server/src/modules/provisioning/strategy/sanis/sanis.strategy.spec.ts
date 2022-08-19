import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SchoolUc } from '@src/modules/school/uc/school.uc';
import { ProvisioningSchoolOutputDto } from '@src/modules/provisioning/dto/provisioning-school-output.dto';
import { ProvisioningUserOutputDto } from '@src/modules/provisioning/dto/provisioning-user-output.dto';
import { UserUc } from '@src/modules/user/uc';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { SanisProvisioningStrategy } from '@src/modules/provisioning/strategy/sanis/sanis.strategy';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import {
	SanisResponse,
	SanisResponseName,
	SanisResponseOrganisation,
	SanisResponsePersonenkontext,
	SanisRole,
} from '@src/modules/provisioning/strategy/sanis/sanis.response';
import { of } from 'rxjs';
import { UUID } from 'bson';
import { UnprocessableEntityException } from '@nestjs/common';
import { SanisResponseMapper } from './sanis-response.mapper';
import { SchoolDto } from '../../../school/uc/dto/school.dto';

const mapper: DeepMocked<SanisResponseMapper> = createMock<SanisResponseMapper>();

const schoolUc: DeepMocked<SchoolUc> = createMock<SchoolUc>();

const userUc: DeepMocked<UserUc> = createMock<UserUc>();

const httpService: DeepMocked<HttpService> = createMock<HttpService>();

const createAxiosResponse = (data: SanisResponse): AxiosResponse<SanisResponse> => ({
	data: data ?? {},
	status: 0,
	statusText: '',
	headers: {},
	config: {},
});

const params = {
	provisioningUrl: 'sanisProvisioningUrl',
	accessToken: 'sanisAccessToken',
};

describe('SanisStrategy', () => {
	let sanisStrategy: SanisProvisioningStrategy;

	beforeEach(() => {
		sanisStrategy = new SanisProvisioningStrategy(mapper, schoolUc, userUc, httpService);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('apply', () => {
		const userUUID: UUID = new UUID('aef1f4fd-c323-466e-962b-a84354c0e713');
		const schoolUUID: UUID = new UUID('df66c8e6-cfac-40f7-b35b-0da5d8ee680e');
		const schoolDto: ProvisioningSchoolOutputDto = new ProvisioningSchoolOutputDto({
			id: 'schoolId',
			name: 'schoolName',
			externalId: userUUID.toString(),
		});
		const userDto: ProvisioningUserOutputDto = new ProvisioningUserOutputDto({
			firstName: 'firstName',
			lastName: 'lastame',
			email: '',
			roleNames: [],
			schoolId: 'schoolId',
			externalId: schoolUUID.toString(),
		});

		const mockResponse: SanisResponse = new SanisResponse({
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
		beforeEach(() => {
			schoolUc.saveProvisioningSchoolOutputDto.mockResolvedValue(schoolDto);
		});

		it('should apply strategy', async () => {
			// Arrange
			httpService.get.mockReturnValue(of(createAxiosResponse(mockResponse)));
			mapper.mapToSchoolDto.mockReturnValue(schoolDto);
			mapper.mapToUserDto.mockReturnValue(userDto);

			// Act
			const result = await sanisStrategy.apply(params);

			// Assert
			expect(mapper.mapToSchoolDto).toHaveBeenCalledWith(mockResponse);
			expect(schoolUc.saveProvisioningSchoolOutputDto).toHaveBeenCalledWith(schoolDto);
			expect(mapper.mapToUserDto).toHaveBeenCalledWith(mockResponse, schoolDto.id);
			expect(userUc.saveProvisioningUserOutputDto).toHaveBeenCalled();
			expect(result.externalUserId).toEqual(userDto.externalId);
		});

		it('should throw error when there is no school saved', async () => {
			// Arrange
			httpService.get.mockReturnValue(of(createAxiosResponse(mockResponse)));
			mapper.mapToUserDto.mockReturnValue(userDto);
			schoolUc.saveProvisioningSchoolOutputDto.mockResolvedValue(new SchoolDto({ name: 'schoolName' }));

			// Act & Assert
			await expect(sanisStrategy.apply({ provisioningUrl: '', accessToken: '' })).rejects.toThrow(
				UnprocessableEntityException
			);
		});
	});

	describe('getType', () => {
		it('should return type SANIS', () => {
			const retType: SystemProvisioningStrategy = sanisStrategy.getType();
			expect(retType).toEqual(SystemProvisioningStrategy.SANIS);
		});
	});
});
