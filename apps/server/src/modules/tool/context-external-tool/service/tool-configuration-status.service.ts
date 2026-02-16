import { MediaSchoolLicense, MediaSchoolLicenseService } from '@modules/school-license';
import { UserService } from '@modules/user';
import { MediaUserLicense, MediaUserLicenseService } from '@modules/user-license';
import { Inject } from '@nestjs/common';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { ValidationError } from '@shared/common/error';
import { EntityId } from '@shared/domain/types';
import {
	ContextExternalToolConfigurationStatus,
	ToolParameterMandatoryValueMissingLoggableException,
	ToolParameterOptionalValueMissingLoggableException,
} from '../../common/domain';
import { CommonToolValidationService } from '../../common/service';
import { ExternalTool } from '../../external-tool/domain';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { TOOL_CONFIG_TOKEN, ToolConfig } from '../../tool-config';
import { ContextExternalToolLaunchable } from '../domain';

@Injectable()
export class ToolConfigurationStatusService {
	constructor(
		private readonly commonToolValidationService: CommonToolValidationService,
		private readonly mediaUserLicenseService: MediaUserLicenseService,
		private readonly mediaSchoolLicenseService: MediaSchoolLicenseService,
		@Inject(TOOL_CONFIG_TOKEN) private readonly config: ToolConfig,
		private readonly userService: UserService
	) {}

	public async determineToolConfigurationStatus(
		externalTool: ExternalTool,
		schoolExternalTool: SchoolExternalTool,
		contextExternalTool: ContextExternalToolLaunchable,
		userId: EntityId
	): Promise<ContextExternalToolConfigurationStatus> {
		const configurationStatus: ContextExternalToolConfigurationStatus = new ContextExternalToolConfigurationStatus({
			isDeactivated: this.isToolDeactivated(externalTool, schoolExternalTool),
			isNotLicensed: !(await this.isToolLicensed(externalTool, userId)),
			...this.getSchoolScopeValidationStatus(externalTool, schoolExternalTool),
			...this.getContextScopeValidationStatus(externalTool, contextExternalTool),
		});

		return configurationStatus;
	}

	private getSchoolScopeValidationStatus(
		externalTool: ExternalTool,
		schoolExternalTool: SchoolExternalTool
	): { isOutdatedOnScopeSchool: boolean } {
		const schoolParameterErrors: ValidationError[] = this.commonToolValidationService.validateParameters(
			externalTool,
			schoolExternalTool
		);

		if (schoolParameterErrors.length) {
			return {
				isOutdatedOnScopeSchool: true,
			};
		}

		return {
			isOutdatedOnScopeSchool: false,
		};
	}

	private getContextScopeValidationStatus(
		externalTool: ExternalTool,
		contextExternalTool: ContextExternalToolLaunchable
	): {
		isOutdatedOnScopeContext: boolean;
		isIncompleteOnScopeContext: boolean;
		isIncompleteOperationalOnScopeContext: boolean;
	} {
		const contextParameterErrors: ValidationError[] = this.commonToolValidationService.validateParameters(
			externalTool,
			contextExternalTool
		);

		if (this.isMandatoryValueMissing(contextParameterErrors)) {
			return {
				isIncompleteOnScopeContext: true,
				isOutdatedOnScopeContext: true,
				isIncompleteOperationalOnScopeContext: false,
			};
		}

		return {
			isIncompleteOnScopeContext: false,
			isOutdatedOnScopeContext: this.isOutdated(contextParameterErrors),
			isIncompleteOperationalOnScopeContext: this.isIncompleteOperational(contextParameterErrors),
		};
	}

	private isToolDeactivated(externalTool: ExternalTool, schoolExternalTool: SchoolExternalTool): boolean {
		return externalTool.isDeactivated || schoolExternalTool.isDeactivated;
	}

	private async isToolLicensed(externalTool: ExternalTool, userId: EntityId): Promise<boolean> {
		const user = await this.userService.findById(userId);
		const isToolLicensedForUser = await this.isToolLicensedForUser(externalTool, userId);
		const isToolLicensedForSchool = await this.isToolLicensedForSchool(externalTool, user.schoolId);
		const isToolLicensed = isToolLicensedForUser || isToolLicensedForSchool;

		return isToolLicensed;
	}

	private async isToolLicensedForUser(externalTool: ExternalTool, userId: EntityId): Promise<boolean> {
		if (this.config.featureSchulconnexMediaLicenseEnabled) {
			const mediaUserLicenses: MediaUserLicense[] = await this.mediaUserLicenseService.getMediaUserLicensesForUser(
				userId
			);

			const externalToolMedium = externalTool.medium;
			if (externalToolMedium?.mediumId) {
				const isLicensed = this.mediaUserLicenseService.hasLicenseForExternalTool(
					externalToolMedium,
					mediaUserLicenses
				);

				return isLicensed;
			}
		}
		return true;
	}

	private async isToolLicensedForSchool(externalTool: ExternalTool, schoolId: EntityId): Promise<boolean> {
		if (this.config.featureVidisMediaActivationsEnabled) {
			const mediaSchoolLicenses: MediaSchoolLicense[] =
				await this.mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId(schoolId);

			const externalToolMedium = externalTool.medium;
			if (externalToolMedium?.mediumId) {
				const isLicensed = this.mediaSchoolLicenseService.hasLicenseForExternalTool(
					externalToolMedium,
					mediaSchoolLicenses
				);

				return isLicensed;
			}
		}
		return true;
	}

	private isMandatoryValueMissing(errors: ValidationError[]): boolean {
		return errors.some(
			(error: ValidationError) => error instanceof ToolParameterMandatoryValueMissingLoggableException
		);
	}

	private isIncompleteOperational(errors: ValidationError[]): boolean {
		return errors.some((error: ValidationError) => error instanceof ToolParameterOptionalValueMissingLoggableException);
	}

	private isOutdated(contextParameterErrors: ValidationError[]): boolean {
		const parameterWithoutOptional: ValidationError[] = contextParameterErrors.filter(
			(error: ValidationError) => !this.isOptional(error)
		);

		return parameterWithoutOptional.length > 0;
	}

	private isOptional(error: ValidationError): boolean {
		return error instanceof ToolParameterOptionalValueMissingLoggableException;
	}
}
