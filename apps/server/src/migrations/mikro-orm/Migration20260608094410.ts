import { Migration } from '@mikro-orm/migrations-mongodb';
import { ObjectId } from '@mikro-orm/mongodb';
import { Permission } from '@shared/domain/interface';

// Migrations for serviceAccountUser with Account User and Role

export class Migration20260608094410 extends Migration {
	public async up(): Promise<void> {
		const serviceAccountRole = await this.getCollection('roles').insertOne({
			name: 'deleteS3FilesCronjobServiceAccount',
			roles: [],
			permissions: [Permission.CAN_EXECUTE_INSTANCE_OPERATIONS, Permission.FILE_DELETE],
		});

		const serviceAccountUser = await this.getCollection('users').insertOne({
			roles: [serviceAccountRole.insertedId],
			email: 'delete-s3-files-cronjob@schul-cloud.org',
			schoolId: new ObjectId('5f2987e020834114b8efd6f8'),
			firstName: 'DeleteS3FilesCronjob',
			lastName: 'ServiceAccount',
			allSearchableStrings: [],
			forcePasswordChange: false,
			parents: [],
			language: 'de',
			preferences: {
				registrationMailSend: true,
				firstLogin: true,
			},
			consent: {
				parentConsents: [],
				userConsent: {
					form: 'digital',
					privacyConsent: true,
					termsOfUseConsent: true,
					dateOfPrivacyConsent: new Date(),
					dateOfTermsOfUseConsent: new Date(),
				},
			},
			deletedAt: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		const serviceAccountAccount = await this.getCollection('accounts').insertOne({
			createdAt: new Date(),
			updatedAt: new Date(),
			username: 'delete-s3-files-cronjob@schul-cloud.org',
			password: '$2b$10$ShqoCysSIDGzD7hG0GEmjeogawoY1KsDvfDGFcL.y3iLGtGPOiLB.',
			userId: serviceAccountUser.insertedId,
			activated: true,
			lastLogin: new Date(),
		});

		console.info(
			`System account was created with ${serviceAccountAccount.insertedId.toString()} as account id, ${serviceAccountUser.insertedId.toString()} as user id and ${serviceAccountRole.insertedId.toString()} as role id.\n`
		);
	}
}
