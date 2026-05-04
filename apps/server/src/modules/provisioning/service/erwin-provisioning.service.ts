import { ObjectId } from '@mikro-orm/mongodb';
import { AccountSave, AccountService } from '@modules/account';
import { ErwinIdentifierService, ReferencedEntityType } from '@modules/erwin-identifier';
import { RoleDto, RoleName, RoleService } from '@modules/role';
import {
	FileStorageType,
	School,
	SchoolFactory,
	SchoolFeature,
	SchoolPermissions,
	SchoolService,
	SchoolYearEntityMapper,
	SchoolYearService,
} from '@modules/school';
import { UserDo, UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { RoleReference } from '@shared/domain/domainobject';
import crypto from 'node:crypto';
import { TypeGuard } from '@shared/common/guards';
import { ExternalSchoolDto, ExternalUserDto, ProvisioningSystemDto } from '../dto';
// TODO: Import ExternalClassDto when implementing CLASS provisioning
// import { ExternalClassDto } from '../dto';
import {
	ExternalIdMissingLoggableException,
	SchoolMissingLoggableException,
	SchoolNameRequiredLoggableException,
	UserRoleUnknownLoggableException,
} from '../loggable';

export enum ProvisioningEntityType {
	USER = 'USER',
	SCHOOL = 'SCHOOL',
	CLASS = 'CLASS',
}

export type ProvisioningResult = School | UserDo;
// TODO: Add Class type when implementing CLASS provisioning
// export type ProvisioningResult = School | UserDo | Class;
export type ExternalEntityData = ExternalSchoolDto | ExternalUserDto;
// TODO: Add ExternalClassDto when implementing CLASS provisioning
// export type ExternalEntityData = ExternalSchoolDto | ExternalUserDto | ExternalClassDto;

interface ProvisioningContext {
	system: ProvisioningSystemDto;
	externalSchool?: ExternalSchoolDto;
	externalUser?: ExternalUserDto;
	// TODO: Add externalClasses when implementing CLASS provisioning
	// externalClasses?: ExternalClassDto[];
}

@Injectable()
export class ErwinProvisioningService {
	constructor(
		private readonly schoolService: SchoolService,
		private readonly erwinIdentifierService: ErwinIdentifierService,
		private readonly schoolYearService: SchoolYearService,
		private readonly userService: UserService,
		private readonly roleService: RoleService,
		private readonly accountService: AccountService
	) {}

	public async provisionEntity(
		entityType: ProvisioningEntityType,
		system: ProvisioningSystemDto,
		externalData: { externalSchool?: ExternalSchoolDto; externalUser?: ExternalUserDto }
	): Promise<ProvisioningResult> {
		const context: ProvisioningContext = { system, ...externalData };

		switch (entityType) {
			case ProvisioningEntityType.SCHOOL:
				if (!externalData.externalSchool) {
					throw new Error('ExternalSchoolDto is required for SCHOOL provisioning');
				}
				return await this.executeProvisioningFlow(entityType, context);

			case ProvisioningEntityType.USER:
				if (!externalData.externalUser || !externalData.externalSchool) {
					throw new Error('ExternalUserDto and ExternalSchoolDto are required for USER provisioning');
				}
				return await this.executeProvisioningFlow(entityType, context);

			case ProvisioningEntityType.CLASS:
				// TODO: Implement CLASS provisioning
				// if (!externalData.externalClasses || externalData.externalClasses.length === 0) {
				// 	throw new Error('ExternalClassDto array is required for CLASS provisioning');
				// }
				// return this.executeProvisioningFlow(entityType, context);
				throw new Error('CLASS provisioning not yet implemented');

			default:
				throw new Error(`Unknown provisioning entity type: ${entityType as string}`);
		}
	}

	private async executeProvisioningFlow(
		entityType: ProvisioningEntityType,
		context: ProvisioningContext
	): Promise<ProvisioningResult> {
		const externalData = this.getExternalDataForType(entityType, context);
		const erwinId = this.getErwinIdFromExternalData(entityType, context);

		const entityFoundByErwinId = await this.findEntityByErwinId(entityType, erwinId);

		if (entityFoundByErwinId) {
			return this.handleEntityFoundByErwinId(entityType, entityFoundByErwinId, externalData, context);
		}

		this.validateExternalId(entityType, externalData);

		const entityFoundByExternalId = await this.findEntityByExternalId(entityType, context);

		if (entityFoundByExternalId) {
			return this.handleEntityFoundByExternalId(entityType, entityFoundByExternalId, externalData);
		}

		return this.createEntity(entityType, context);
	}

	private getExternalDataForType(entityType: ProvisioningEntityType, context: ProvisioningContext): ExternalEntityData {
		switch (entityType) {
			case ProvisioningEntityType.SCHOOL:
				return context.externalSchool as ExternalSchoolDto;
			case ProvisioningEntityType.USER:
				return context.externalUser as ExternalUserDto;
			// TODO: Add CLASS case when implementing CLASS provisioning
			// case ProvisioningEntityType.CLASS:
			// 	return context.externalClasses?.[0] as ExternalClassDto;
			default:
				throw new Error(`Unsupported entity type: ${entityType}`);
		}
	}

	private getErwinIdFromExternalData(
		entityType: ProvisioningEntityType,
		context: ProvisioningContext
	): string | undefined {
		switch (entityType) {
			case ProvisioningEntityType.SCHOOL:
				return context.externalSchool?.erwinId;
			case ProvisioningEntityType.USER:
				return context.externalUser?.erwinId;
			// TODO: Add CLASS case when implementing CLASS provisioning
			// case ProvisioningEntityType.CLASS:
			// 	return context.externalClasses?.[0]?.erwinId;
			default:
				return undefined;
		}
	}

	private validateExternalId(entityType: ProvisioningEntityType, externalData: ExternalEntityData): void {
		let dtoName: string;
		switch (entityType) {
			case ProvisioningEntityType.SCHOOL:
				dtoName = 'ExternalSchoolDto';
				break;
			case ProvisioningEntityType.USER:
				dtoName = 'ExternalUserDto';
				break;
			// TODO: Add CLASS case when implementing CLASS provisioning
			// case ProvisioningEntityType.CLASS:
			// 	dtoName = 'ExternalClassDto';
			// 	break;
			default:
				dtoName = 'Unknown';
		}
		const erwinId = 'erwinId' in externalData ? externalData.erwinId : undefined;

		TypeGuard.requireKeys(externalData, ['externalId'], new ExternalIdMissingLoggableException(dtoName, { erwinId }));
	}

	private async findEntityByErwinId(
		entityType: ProvisioningEntityType,
		erwinId: string | undefined
	): Promise<ProvisioningResult | null> {
		if (!erwinId) {
			return null;
		}

		const erwinIdentifier = await this.erwinIdentifierService.findByErwinId(erwinId);
		const expectedType = this.mapEntityTypeToReferencedType(entityType);

		if (!erwinIdentifier || erwinIdentifier.type !== expectedType) {
			return null;
		}

		switch (entityType) {
			case ProvisioningEntityType.SCHOOL:
				return this.schoolService.getSchoolById(erwinIdentifier.referencedEntityId);
			case ProvisioningEntityType.USER:
				return this.userService.findByIdOrNull(erwinIdentifier.referencedEntityId);
			// TODO: Add CLASS case when implementing CLASS provisioning
			// case ProvisioningEntityType.CLASS:
			// 	return this.classService.findById(erwinIdentifier.referencedEntityId);
			default:
				return null;
		}
	}

	private mapEntityTypeToReferencedType(entityType: ProvisioningEntityType): ReferencedEntityType {
		switch (entityType) {
			case ProvisioningEntityType.SCHOOL:
				return ReferencedEntityType.SCHOOL;
			case ProvisioningEntityType.USER:
				return ReferencedEntityType.USER;
			// TODO: Add CLASS case when implementing CLASS provisioning
			// case ProvisioningEntityType.CLASS:
			// 	return ReferencedEntityType.CLASS;
			default:
				throw new Error(`Unsupported entity type for reference mapping: ${entityType}`);
		}
	}

	private async handleEntityFoundByErwinId(
		entityType: ProvisioningEntityType,
		entityFoundByErwinId: ProvisioningResult,
		externalData: ExternalEntityData,
		_context: ProvisioningContext
	): Promise<ProvisioningResult> {
		if (!externalData.externalId) {
			return entityFoundByErwinId;
		}

		return await this.updateEntity(entityType, entityFoundByErwinId, externalData);
	}

	private async updateEntity(
		entityType: ProvisioningEntityType,
		entity: ProvisioningResult,
		externalData: ExternalEntityData
	): Promise<ProvisioningResult> {
		switch (entityType) {
			case ProvisioningEntityType.SCHOOL:
				return await this.updateSchoolEntity(entity as School, externalData as ExternalSchoolDto);
			case ProvisioningEntityType.USER:
				return await this.updateUserEntity(entity as UserDo, externalData as ExternalUserDto);
			// TODO: Add CLASS case when implementing CLASS provisioning
			// case ProvisioningEntityType.CLASS:
			// 	return this.updateClassEntity(entity as Class, externalData as ExternalClassDto);
			default:
				throw new Error(`Update not implemented for entity type: ${entityType}`);
		}
	}

	private async updateSchoolEntity(school: School, externalSchool: ExternalSchoolDto): Promise<School> {
		const externalSchoolName = this.formatSchoolName(externalSchool);

		if (externalSchoolName) {
			school.name = externalSchoolName;
		}

		if (externalSchool.officialSchoolNumber && !school.officialSchoolNumber) {
			school.updateOfficialSchoolNumber(externalSchool.officialSchoolNumber);
		}

		return await this.schoolService.save(school);
	}

	private async updateUserEntity(user: UserDo, externalUser: ExternalUserDto): Promise<UserDo> {
		if (externalUser.firstName) {
			user.firstName = externalUser.firstName;
		}

		if (externalUser.lastName) {
			user.lastName = externalUser.lastName;
		}

		if (externalUser.email) {
			user.email = externalUser.email;
		}

		if (externalUser.birthday) {
			user.birthday = externalUser.birthday;
		}

		return await this.userService.save(user);
	}

	// TODO: Implement updateClassEntity when implementing CLASS provisioning
	// private async updateClassEntity(classEntity: Class, externalClass: ExternalClassDto): Promise<Class> {
	// 	if (externalClass.name) {
	// 		classEntity.name = externalClass.name;
	// 	}
	//
	// 	// Update other class properties as needed
	//
	// 	return this.classService.save(classEntity);
	// }

	private async findEntityByExternalId(
		entityType: ProvisioningEntityType,
		context: ProvisioningContext
	): Promise<ProvisioningResult | null> {
		switch (entityType) {
			case ProvisioningEntityType.SCHOOL:
				return await this.findSchoolByExternalId(context);
			case ProvisioningEntityType.USER:
				return await this.findUserByExternalId(context);
			// TODO: Add CLASS case when implementing CLASS provisioning
			// case ProvisioningEntityType.CLASS:
			// 	return this.findClassByExternalId(context);
			default:
				return null;
		}
	}

	private async findSchoolByExternalId(context: ProvisioningContext): Promise<School | null> {
		const externalSchool = context.externalSchool as ExternalSchoolDto;
		const schools = await this.schoolService.getSchools({
			systemId: context.system.systemId,
			externalId: externalSchool.externalId,
		});

		return schools.length > 0 ? schools[0] : null;
	}

	private async findUserByExternalId(context: ProvisioningContext): Promise<UserDo | null> {
		const externalUser = context.externalUser as ExternalUserDto;

		return await this.userService.findByExternalId(externalUser.externalId, context.system.systemId);
	}

	// TODO: Implement findClassByExternalId when implementing CLASS provisioning
	// private async findClassByExternalId(context: ProvisioningContext): Promise<Class | null> {
	// 	const externalClass = context.externalClasses?.[0] as ExternalClassDto;
	// 	if (!externalClass) {
	// 		return null;
	// 	}
	//
	// 	return this.classService.findByExternalId(externalClass.externalId, context.system.systemId);
	// }

	private async handleEntityFoundByExternalId(
		entityType: ProvisioningEntityType,
		entityFoundByExternalId: ProvisioningResult,
		externalData: ExternalEntityData
	): Promise<ProvisioningResult> {
		const updatedEntity = await this.updateEntity(entityType, entityFoundByExternalId, externalData);

		const erwinId = 'erwinId' in externalData ? externalData.erwinId : undefined;
		if (erwinId) {
			const entityId = this.getEntityId(updatedEntity);
			await this.addErwinIdReference(entityType, entityId, erwinId);
		}

		return updatedEntity;
	}

	private getEntityId(entity: ProvisioningResult): string {
		if ('id' in entity && entity.id) {
			return entity.id;
		}
		throw new Error('Entity does not have an id');
	}

	private async createEntity(
		entityType: ProvisioningEntityType,
		context: ProvisioningContext
	): Promise<ProvisioningResult> {
		switch (entityType) {
			case ProvisioningEntityType.SCHOOL:
				return await this.createSchoolEntity(context);
			case ProvisioningEntityType.USER:
				return await this.createUserEntity(context);
			// TODO: Add CLASS case when implementing CLASS provisioning
			// case ProvisioningEntityType.CLASS:
			// 	return this.createClassEntity(context);
			default:
				throw new Error(`Create not implemented for entity type: ${entityType}`);
		}
	}

	private async createSchoolEntity(context: ProvisioningContext): Promise<School> {
		const externalSchool = context.externalSchool as ExternalSchoolDto;
		const schoolName = this.formatSchoolName(externalSchool);

		if (!schoolName) {
			throw new SchoolNameRequiredLoggableException('ExternalSchool.name');
		}

		const schoolYearEntity = await this.schoolYearService.getCurrentSchoolYear();
		const schoolYear = SchoolYearEntityMapper.mapToDo(schoolYearEntity);

		const permissions: SchoolPermissions = {
			teacher: {
				STUDENT_LIST: true,
			},
		};

		const school = SchoolFactory.build({
			id: new ObjectId().toHexString(),
			externalId: externalSchool.externalId,
			name: schoolName,
			officialSchoolNumber: externalSchool.officialSchoolNumber,
			systemIds: [context.system.systemId],
			currentYear: schoolYear,
			features: new Set([SchoolFeature.OAUTH_PROVISIONING_ENABLED]),
			fileStorageType: FileStorageType.AWS_S3,
			permissions,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		const savedSchool = await this.schoolService.save(school);

		if (externalSchool.erwinId) {
			await this.addErwinIdReference(ProvisioningEntityType.SCHOOL, savedSchool.id, externalSchool.erwinId);
		}

		return savedSchool;
	}

	private async createUserEntity(context: ProvisioningContext): Promise<UserDo> {
		const externalUser = context.externalUser as ExternalUserDto;

		const school = await this.findSchoolByExternalId(context);
		if (!school) {
			throw new SchoolMissingLoggableException(externalUser);
		}

		const roleRefs = await this.createRoleReferences(externalUser.roles);
		if (!roleRefs?.length) {
			throw new UserRoleUnknownLoggableException(externalUser);
		}

		const user = new UserDo({
			externalId: externalUser.externalId,
			firstName: externalUser.firstName ?? '',
			preferredName: externalUser.preferredName,
			lastName: externalUser.lastName ?? '',
			email: externalUser.email ?? '',
			roles: roleRefs,
			schoolId: school.id,
			birthday: externalUser.birthday,
			secondarySchools: [],
		});

		const savedUser = await this.userService.save(user);

		await this.accountService.saveWithValidation({
			userId: savedUser.id,
			username: crypto
				.createHash('sha256')
				.update(savedUser.id as string)
				.digest('base64'),
			systemId: context.system.systemId,
			activated: true,
		} as AccountSave);

		if (externalUser.erwinId) {
			await this.addErwinIdReference(ProvisioningEntityType.USER, savedUser.id as string, externalUser.erwinId);
		}

		return savedUser;
	}

	private async createRoleReferences(roles?: RoleName[]): Promise<RoleReference[] | undefined> {
		if (roles?.length) {
			const foundRoles = await this.roleService.findByNames(roles);
			const roleRefs = foundRoles.map(
				(role: RoleDto): RoleReference => new RoleReference({ id: role.id, name: role.name })
			);

			return roleRefs;
		}

		return undefined;
	}

	// TODO: Implement createClassEntity when implementing CLASS provisioning
	// private async createClassEntity(context: ProvisioningContext): Promise<Class> {
	// 	const externalClass = context.externalClasses?.[0] as ExternalClassDto;
	// 	if (!externalClass) {
	// 		throw new Error('ExternalClassDto is required for class creation');
	// 	}
	//
	// 	// Find the school to link the class to
	// 	const school = await this.findSchoolByExternalId(context);
	// 	if (!school) {
	// 		throw new Error('School not found for class creation');
	// 	}
	//
	// 	const classEntity = new Class({
	// 		id: new ObjectId().toHexString(),
	// 		externalId: externalClass.externalId,
	// 		name: externalClass.name,
	// 		schoolId: school.id,
	// 		// ... other class properties
	// 	});
	//
	// 	const savedClass = await this.classService.save(classEntity);
	//
	// 	if (externalClass.erwinId) {
	// 		await this.addErwinIdReference(ProvisioningEntityType.CLASS, savedClass.id, externalClass.erwinId);
	// 	}
	//
	// 	return savedClass;
	// }

	private async addErwinIdReference(
		entityType: ProvisioningEntityType,
		entityId: string,
		erwinId: string
	): Promise<void> {
		const existingIdentifier = await this.erwinIdentifierService.findByErwinId(erwinId);

		if (existingIdentifier) {
			return;
		}

		const referencedType = this.mapEntityTypeToReferencedType(entityType);

		await this.erwinIdentifierService.createErwinIdentifier({
			erwinId,
			type: referencedType,
			referencedEntityId: entityId,
		});
	}

	private formatSchoolName(externalSchool: ExternalSchoolDto): string | undefined {
		if (!externalSchool.name) {
			return undefined;
		}

		return externalSchool.location ? `${externalSchool.name} (${externalSchool.location})` : externalSchool.name;
	}
}
