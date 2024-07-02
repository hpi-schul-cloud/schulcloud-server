import { MediaBoardConfig } from '@modules/board/media-board.config';
import { MediaUserLicense, MediaUserLicenseService } from '@modules/user-license';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { ConfigService } from '@nestjs/config';
import { ValidationError } from '@shared/common';
import { EntityId } from '@shared/domain/types';
import {
	ContextExternalToolConfigurationStatus,
	ToolParameterMandatoryValueMissingLoggableException,
	ToolParameterOptionalValueMissingLoggableException,
} from '../../common/domain';
import { CommonToolValidationService } from '../../common/service';
import { ExternalTool } from '../../external-tool/domain';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { ContextExternalToolLaunchable } from '../domain';

@Injectable()
export class ToolConfigurationStatusService {
	constructor(
		private readonly commonToolValidationService: CommonToolValidationService,
		private readonly mediaUserLicenseService: MediaUserLicenseService,
		private readonly configService: ConfigService<MediaBoardConfig, true>
	) {}

	public async determineToolConfigurationStatus(
		externalTool: ExternalTool,
		schoolExternalTool: SchoolExternalTool,
		contextExternalTool: ContextExternalToolLaunchable,
		userId: EntityId
	): Promise<ContextExternalToolConfigurationStatus> {
		const configurationStatus: ContextExternalToolConfigurationStatus = new ContextExternalToolConfigurationStatus({
			isOutdatedOnScopeContext: false,
			isIncompleteOnScopeContext: false,
			isIncompleteOperationalOnScopeContext: false,
			isOutdatedOnScopeSchool: false,
			isDeactivated: this.isToolDeactivated(externalTool, schoolExternalTool),
			isNotLicensed: !(await this.isToolLicensed(externalTool, userId)),
		});

		const schoolParameterErrors: ValidationError[] = this.commonToolValidationService.validateParameters(
			externalTool,
			schoolExternalTool
		);

		if (schoolParameterErrors.length) {
			configurationStatus.isOutdatedOnScopeSchool = true;
		}

		const contextParameterErrors: ValidationError[] = this.commonToolValidationService.validateParameters(
			externalTool,
			contextExternalTool
		);

		if (contextParameterErrors.length) {
			configurationStatus.isOutdatedOnScopeContext = true;

			if (
				contextParameterErrors.some(
					(error: ValidationError) => error instanceof ToolParameterMandatoryValueMissingLoggableException
				)
			) {
				configurationStatus.isIncompleteOnScopeContext = true;
			} else if (this.isIncompleteOperational(contextParameterErrors) && !this.isOutdated(contextParameterErrors)) {
				configurationStatus.isIncompleteOperationalOnScopeContext = true;
				configurationStatus.isOutdatedOnScopeContext = false;
			} else if (this.isIncompleteOperational(contextParameterErrors) && this.isOutdated(contextParameterErrors)) {
				configurationStatus.isIncompleteOperationalOnScopeContext = true;
			}
		}

		return configurationStatus;
	}

	private isToolDeactivated(externalTool: ExternalTool, schoolExternalTool: SchoolExternalTool): boolean {
		return !!(externalTool.isDeactivated || (schoolExternalTool.status && schoolExternalTool.status.isDeactivated));
	}

	private async isToolLicensed(externalTool: ExternalTool, userId: EntityId): Promise<boolean> {
		if (this.configService.get('FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED')) {
			const mediaUserLicenses: MediaUserLicense[] = await this.mediaUserLicenseService.getMediaUserLicensesForUser(
				userId
			);

			const externalToolMedium = externalTool.medium;
			if (externalToolMedium) {
				return this.mediaUserLicenseService.hasLicenseForExternalTool(externalToolMedium, mediaUserLicenses);
			}
		}
		return true;
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

	isOptional(error: ValidationError): boolean {
		return error instanceof ToolParameterOptionalValueMissingLoggableException;
	}
}
