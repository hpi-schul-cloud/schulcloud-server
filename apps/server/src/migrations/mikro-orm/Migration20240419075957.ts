import { Migration } from '@mikro-orm/migrations-mongodb';
import { LtiMessageType, ToolConfigType } from '@modules/tool/common/enum';

export class Migration20240419075957 extends Migration {
	async up(): Promise<void> {
		const result = await this.driver.nativeUpdate(
			'external-tools',
			{
				config_type: ToolConfigType.LTI11,
				config_lti_message_type: { $ne: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST },
			},
			{ config_lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST }
		);

		console.info(`Changed ${result.affectedRows} lti_message_type(s) to basic-lti-launch-request in external-tools`);
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	async down(): Promise<void> {
		console.error(`Migration down not implemented. You might need to restore database from backup!`);
	}
}
