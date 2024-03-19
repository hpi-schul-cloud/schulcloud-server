import { Group, GroupService, GroupTypes } from '@modules/group';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { SchulConneXProvisioningOptions } from '../domain';
import { ProvisioningOptionsUpdateHandler } from './provisioning-options-update-handler';

@Injectable()
export class SchulconnexProvisioningOptionsUpdateService
	implements ProvisioningOptionsUpdateHandler<SchulConneXProvisioningOptions>
{
	constructor(private readonly groupService: GroupService) {}

	public async handleUpdate(
		schoolId: EntityId,
		systemId: EntityId,
		newOptions: SchulConneXProvisioningOptions,
		oldOptions: SchulConneXProvisioningOptions
	): Promise<void> {
		if (oldOptions.groupProvisioningClassesEnabled && !newOptions.groupProvisioningClassesEnabled) {
			await this.deleteGroups(schoolId, systemId, GroupTypes.CLASS);
		}

		if (oldOptions.groupProvisioningCoursesEnabled && !newOptions.groupProvisioningCoursesEnabled) {
			await this.deleteGroups(schoolId, systemId, GroupTypes.COURSE);
		}

		if (oldOptions.groupProvisioningOtherEnabled && !newOptions.groupProvisioningOtherEnabled) {
			await this.deleteGroups(schoolId, systemId, GroupTypes.OTHER);
		}
	}

	private async deleteGroups(schoolId: EntityId, systemId: EntityId, groupType: GroupTypes): Promise<void> {
		const groups: Group[] = await this.groupService.findGroupsBySchoolIdAndSystemIdAndGroupType(
			schoolId,
			systemId,
			groupType
		);

		await Promise.all(
			groups.map(async (group: Group): Promise<void> => {
				await this.groupService.delete(group);
			})
		);
	}
}
