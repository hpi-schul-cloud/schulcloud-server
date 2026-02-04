import { Migration } from '@mikro-orm/migrations-mongodb';
import { ObjectId } from 'mongodb';

// An issue in the code caused guest teachers to not have their secondarySchools cleaned up when when a room on a different school, that they were part of, was deleted.
// This migration finds all users that have secondarySchools assigned, checks if they are still members of any rooms in those schools,
// and if not, removes the secondarySchool from the user.

type UserWithSecondarySchools = {
	_id: ObjectId;
	secondarySchoolIds: ObjectId[];
	activeSecondarySchoolIds: ObjectId[];
	schoolsIdsToRemove: ObjectId[];
	ownSchoolId: ObjectId;
};

export class Migration20260130082056 extends Migration {
	public async up(): Promise<void> {
		const usersToUpdate = await this.getCollection('users')
			.aggregate<UserWithSecondarySchools>([
				{
					$match: {
						secondarySchools: {
							$exists: true,
							$ne: [],
						},
					},
				},
				{
					$lookup: {
						from: 'groups',
						let: {
							userId: '$_id',
						},
						pipeline: [
							{
								$match: {
									type: 'room',
									$expr: {
										$in: ['$$userId', '$users.user'],
									},
								},
							},
						],
						as: 'userGroups',
					},
				},
				{
					$lookup: {
						from: 'room-memberships',
						localField: 'userGroups._id',
						foreignField: 'userGroup',
						as: 'roomMemberships',
					},
				},
				{
					$addFields: {
						secondarySchoolIds: {
							$map: {
								input: '$secondarySchools',
								as: 'school',
								in: '$$school.school',
							},
						},
					},
				},
				{
					$addFields: {
						activeSecondarySchoolIds: {
							$setDifference: ['$roomMemberships.school', ['$schoolId']],
						},
					},
				},
				{
					$addFields: {
						secondarySchoolIdsToRemove: {
							$setDifference: ['$secondarySchoolIds', '$activeSecondarySchoolIds'],
						},
					},
				},
				{
					$match: {
						'schoolIdsToRemove.0': {
							$exists: true,
						},
					},
				},
				{
					$project: {
						_id: 1,
						secondarySchoolIds: 1,
						activeSecondarySchoolIds: 1,
						secondarySchoolIdsToRemove: 1,
						ownSchoolId: '$schoolId',
					},
				},
			])
			.toArray();

		console.log(
			`Found ${usersToUpdate.length} users with secondary schools despite not being members of any rooms in those schools.`
		);

		if (usersToUpdate.length === 0) {
			console.log('No action required. Exiting migration.');
			return;
		}

		for (const user of usersToUpdate) {
			const newSecondarySchoolIds: ObjectId[] = user.activeSecondarySchoolIds || [];

			console.log(`Updating user ${user._id.toString()} (school ${user.ownSchoolId.toString()})`);

			if (newSecondarySchoolIds.length > 0) {
				await this.getCollection('users').updateOne(
					{ _id: user._id },
					{ $set: { secondarySchools: newSecondarySchoolIds } }
				);
			} else {
				await this.getCollection('users').updateOne({ _id: user._id }, { $unset: { secondarySchools: '' } });
			}
		}
	}

	public down(): Promise<void> {
		throw new Error('Migration cannot be reverted');
	}
}
