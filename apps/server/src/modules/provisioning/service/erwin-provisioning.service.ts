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
import { TypeGuard } from '@shared/common/guards';
import { RoleReference } from '@shared/domain/domainobject';
import crypto from 'node:crypto';
import { ExternalSchoolDto, ExternalUserDto, ProvisioningSystemDto } from '../dto';
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
export type ExternalEntityData = ExternalSchoolDto | ExternalUserDto;
// TODO: Add ExternalClassDto when implementing CLASS provisioning

interface ProvisioningContext {
	system: ProvisioningSystemDto;
	externalSchool?: ExternalSchoolDto;
	externalUser?: ExternalUserDto;
	// TODO: Add externalClasses field when implementing CLASS provisioning
}

interface ProvisioningEntityHandler {
	validate(context: ProvisioningContext): void;
	getExternalData(context: ProvisioningContext): ExternalEntityData;
	getErwinId(context: ProvisioningContext): string | undefined;
	referencedEntityType: ReferencedEntityType;
	dtoName: string;
	findByErwinId(entityId: string): Promise<ProvisioningResult | null>;
	findByExternalId(context: ProvisioningContext): Promise<ProvisioningResult | null>;
	create(context: ProvisioningContext): Promise<ProvisioningResult>;
	update(entity: ProvisioningResult, externalData: ExternalEntityData): Promise<ProvisioningResult>;
}

@Injectable()
export class ErwinProvisioningService {
	private readonly handlers: Map<ProvisioningEntityType, ProvisioningEntityHandler>;

	constructor(
		private readonly schoolService: SchoolService,
		private readonly erwinIdentifierService: ErwinIdentifierService,
		private readonly schoolYearService: SchoolYearService,
		private readonly userService: UserService,
		private readonly roleService: RoleService,
		private readonly accountService: AccountService
	) {
		this.handlers = this.initHandlers();
	}

	public async provisionEntity(
		entityType: ProvisioningEntityType,
		system: ProvisioningSystemDto,
		externalData: { externalSchool?: ExternalSchoolDto; externalUser?: ExternalUserDto }
	): Promise<ProvisioningResult> {
		const context: ProvisioningContext = { system, ...externalData };
		const handler = this.getHandler(entityType);

		handler.validate(context);

		return await this.executeProvisioningFlow(handler, context);
	}

	private async executeProvisioningFlow(
		handler: ProvisioningEntityHandler,
		context: ProvisioningContext
	): Promise<ProvisioningResult> {
		const externalData = handler.getExternalData(context);
		const erwinId = handler.getErwinId(context);

		if (erwinId) {
			const erwinIdentifier = await this.erwinIdentifierService.findByErwinId(erwinId);

			if (erwinIdentifier && erwinIdentifier.type === handler.referencedEntityType) {
				const entity = await handler.findByErwinId(erwinIdentifier.referencedEntityId);

				if (entity) {
					return externalData.externalId ? handler.update(entity, externalData) : entity;
				}
			}
		}

		TypeGuard.requireKeys(
			externalData,
			['externalId'],
			new ExternalIdMissingLoggableException(handler.dtoName, { erwinId })
		);

		const entityByExternalId = await handler.findByExternalId(context);

		if (entityByExternalId) {
			const updated = await handler.update(entityByExternalId, externalData);

			if (erwinId) {
				await this.addErwinIdReference(handler.referencedEntityType, this.getEntityId(updated), erwinId);
			}

			return updated;
		}

		return handler.create(context);
	}

	private getHandler(entityType: ProvisioningEntityType): ProvisioningEntityHandler {
		const handler = this.handlers.get(entityType);

		if (!handler) {
			throw new Error(`No handler registered for entity type: ${entityType}`);
		}

		return handler;
	}

	private initHandlers(): Map<ProvisioningEntityType, ProvisioningEntityHandler> {
		const handlers = new Map<ProvisioningEntityType, ProvisioningEntityHandler>();

		handlers.set(ProvisioningEntityType.SCHOOL, {
			validate: (ctx: ProvisioningContext): void => {
				if (!ctx.externalSchool) {
					throw new Error('ExternalSchoolDto is required for SCHOOL provisioning');
				}
			},
			getExternalData: (ctx: ProvisioningContext): ExternalEntityData => ctx.externalSchool as ExternalSchoolDto,
			getErwinId: (ctx: ProvisioningContext): string | undefined => ctx.externalSchool?.erwinId,
			referencedEntityType: ReferencedEntityType.SCHOOL,
			dtoName: 'ExternalSchoolDto',
			findByErwinId: (id: string): Promise<ProvisioningResult | null> => this.schoolService.getSchoolById(id),
			findByExternalId: (ctx: ProvisioningContext): Promise<ProvisioningResult | null> =>
				this.findSchoolByExternalId(ctx),
			create: (ctx: ProvisioningContext): Promise<ProvisioningResult> => this.createSchoolEntity(ctx),
			update: (entity: ProvisioningResult, data: ExternalEntityData): Promise<ProvisioningResult> =>
				this.updateSchoolEntity(entity as School, data as ExternalSchoolDto),
		});

		handlers.set(ProvisioningEntityType.USER, {
			validate: (ctx: ProvisioningContext): void => {
				if (!ctx.externalUser) {
					throw new Error('ExternalUserDto is required for USER provisioning');
				}
				if (!ctx.externalSchool) {
					throw new Error('ExternalSchoolDto is required for USER provisioning');
				}
			},
			getExternalData: (ctx: ProvisioningContext): ExternalEntityData => ctx.externalUser as ExternalUserDto,
			getErwinId: (ctx: ProvisioningContext): string | undefined => ctx.externalUser?.erwinId,
			referencedEntityType: ReferencedEntityType.USER,
			dtoName: 'ExternalUserDto',
			findByErwinId: (id: string): Promise<ProvisioningResult | null> => this.userService.findByIdOrNull(id),
			findByExternalId: (ctx: ProvisioningContext): Promise<ProvisioningResult | null> =>
				this.findUserByExternalId(ctx),
			create: (ctx: ProvisioningContext): Promise<ProvisioningResult> => this.createUserEntity(ctx),
			update: (entity: ProvisioningResult, data: ExternalEntityData): Promise<ProvisioningResult> =>
				this.updateUserEntity(entity as UserDo, data as ExternalUserDto),
		});

		// TODO: Register CLASS handler when implementing CLASS provisioning

		return handlers;
	}

	private getEntityId(entity: ProvisioningResult): string {
		if ('id' in entity && entity.id) {
			return entity.id;
		}
		throw new Error('Entity does not have an id');
	}

	private async addErwinIdReference(
		referencedType: ReferencedEntityType,
		entityId: string,
		erwinId: string
	): Promise<void> {
		const existingIdentifier = await this.erwinIdentifierService.findByErwinId(erwinId);

		if (existingIdentifier) {
			return;
		}

		await this.erwinIdentifierService.createErwinIdentifier({
			erwinId,
			type: referencedType,
			referencedEntityId: entityId,
		});
	}

	// --- School-specific methods ---

	private async findSchoolByExternalId(context: ProvisioningContext): Promise<School | null> {
		const externalSchool = context.externalSchool as ExternalSchoolDto;
		const schools = await this.schoolService.getSchools({
			systemId: context.system.systemId,
			externalId: externalSchool.externalId,
		});

		return schools.length > 0 ? schools[0] : null;
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
			await this.addErwinIdReference(ReferencedEntityType.SCHOOL, savedSchool.id, externalSchool.erwinId);
		}

		return savedSchool;
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

	private formatSchoolName(externalSchool: ExternalSchoolDto): string | undefined {
		if (!externalSchool.name) {
			return undefined;
		}

		return externalSchool.location ? `${externalSchool.name} (${externalSchool.location})` : externalSchool.name;
	}

	// --- User-specific methods ---

	private async findUserByExternalId(context: ProvisioningContext): Promise<UserDo | null> {
		const externalUser = context.externalUser as ExternalUserDto;

		return await this.userService.findByExternalId(externalUser.externalId, context.system.systemId);
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
			await this.addErwinIdReference(ReferencedEntityType.USER, savedUser.id as string, externalUser.erwinId);
		}

		return savedUser;
	}

	private async updateUserEntity(user: UserDo, externalUser: ExternalUserDto): Promise<UserDo> {
		if (externalUser.firstName) {
			user.firstName = externalUser.firstName;
		}

		if (externalUser.lastName) {
			user.lastName = externalUser.lastName;
		}

		if (externalUser.preferredName) {
			user.preferredName = externalUser.preferredName;
		}

		if (externalUser.email) {
			user.email = externalUser.email;
		}

		if (externalUser.birthday) {
			user.birthday = externalUser.birthday;
		}

		if (externalUser.roles?.length) {
			const roleRefs = await this.createRoleReferences(externalUser.roles);
			if (roleRefs?.length) {
				user.roles = roleRefs;
			}
		}

		return await this.userService.save(user);
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

	// TODO: Add Class-specific methods (findClassByExternalId, createClassEntity, updateClassEntity) when implementing CLASS provisioning
}
