import { Class, ClassFactory, ClassService, ClassSourceOptions } from '@modules/class';
import { ErwinIdentifierService, ReferencedEntityType } from '@modules/erwin-identifier';
import { School, SchoolService } from '@modules/school';
import { Injectable } from '@nestjs/common';
import { ExternalClassDto, ExternalSchoolDto } from '../dto';
import { BadDataLoggableException } from '../loggable';
import {
	ExternalEntityData,
	ProvisioningContext,
	ProvisioningEntityHandler,
	ProvisioningResult,
} from './erwin-provisioning-handler.interface';

@Injectable()
export class ClassProvisioningHandler implements ProvisioningEntityHandler {
	public readonly referencedEntityType = ReferencedEntityType.CLASS;

	public readonly dtoName = ExternalClassDto.name;

	constructor(
		private readonly classService: ClassService,
		private readonly schoolService: SchoolService,
		private readonly erwinIdentifierService: ErwinIdentifierService
	) {}

	public validate(context: ProvisioningContext): void {
		if (!context.externalClass) {
			throw new Error('ExternalClassDto is required for CLASS provisioning');
		}

		if (!context.externalSchool) {
			throw new Error('ExternalSchoolDto is required for CLASS provisioning');
		}
	}

	public getExternalData(context: ProvisioningContext): ExternalEntityData {
		return context.externalClass as ExternalClassDto;
	}

	public getErwinId(context: ProvisioningContext): string | undefined {
		return context.externalClass?.erwinId;
	}

	public findByEntityId(entityId: string): Promise<ProvisioningResult | null> {
		return this.classService.findById(entityId);
	}

	public async findByExternalId(context: ProvisioningContext): Promise<Class | null> {
		const externalClass = context.externalClass as ExternalClassDto;

		const school = await this.findSchoolByExternalId(context);
		if (!school) {
			return null;
		}

		const foundClass = await this.classService.findClassWithSchoolIdAndExternalId(school.id, externalClass.externalId);

		return foundClass;
	}

	public async create(context: ProvisioningContext): Promise<Class> {
		const externalClass = context.externalClass as ExternalClassDto;

		const school = await this.findSchoolByExternalId(context);
		if (!school) {
			throw new BadDataLoggableException('School not found for class provisioning', {
				externalClassId: externalClass.externalId,
			});
		}

		const newClass = ClassFactory.create({
			name: externalClass.name ?? '',
			gradeLevel: externalClass.gradeLevel,
			schoolId: school.id,
			year: school.currentYear?.id,
			sourceOptions: new ClassSourceOptions({ tspUid: externalClass.externalId }),
		});

		await this.classService.save(newClass);

		if (externalClass.erwinId) {
			await this.addErwinIdReference(newClass.id, externalClass.erwinId);
		}

		return newClass;
	}

	public async update(entity: ProvisioningResult, data: ExternalEntityData): Promise<Class> {
		const classEntity = entity as Class;
		const externalClass = data as ExternalClassDto;

		if (externalClass.name) {
			classEntity.name = externalClass.name;
		}

		if (externalClass.gradeLevel !== undefined) {
			classEntity.gradeLevel = externalClass.gradeLevel;
		}

		await this.classService.save(classEntity);

		return classEntity;
	}

	private async findSchoolByExternalId(context: ProvisioningContext): Promise<School | null> {
		const externalSchool = context.externalSchool as ExternalSchoolDto;
		const schools = await this.schoolService.getSchools({
			systemId: context.system.systemId,
			externalId: externalSchool.externalId,
		});

		return schools[0] ?? null;
	}

	private async addErwinIdReference(classId: string, erwinId: string): Promise<void> {
		const existingIdentifier = await this.erwinIdentifierService.findByErwinId(erwinId);

		if (existingIdentifier) {
			return;
		}

		await this.erwinIdentifierService.createErwinIdentifier({
			erwinId,
			type: ReferencedEntityType.CLASS,
			referencedEntityId: classId,
		});
	}
}
