import { Migration } from '@mikro-orm/migrations-mongodb';
import { ObjectId } from 'mongodb';

// An issue in the code caused guest teachers to not have their secondarySchools cleaned up when when a room on a different school, that they were part of, was deleted.
// This migration finds all users that have secondarySchools assigned, checks if they are still members of any rooms in those schools,
// and if not, removes the secondarySchool from the user.

type UserWithSecondarySchools = {
	_id: ObjectId;
	secondarySchools: ObjectId[];
	activeSecondarySchools: ObjectId[];
	schoolsToRemove: ObjectId[];
};

export class Migration20260130082056 extends Migration {
	public async up(): Promise<void> {
		const usersToUpdate = await this.getCollection('users')
			.aggregate<UserWithSecondarySchools>([
				{
					$match: {
						secondarySchools: { $exists: true, $ne: [] },
					},
				},
				{
					$lookup: {
						from: 'groups',
						let: { userId: '$_id' },
						pipeline: [
							{
								$match: {
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
						activeSecondarySchools: '$roomMemberships.school',
					},
				},
				{
					$addFields: {
						schoolsToRemove: {
							$setDifference: ['$secondarySchools', '$activeSecondarySchools'],
						},
					},
				},
				{
					$match: {
						'schoolsToRemove.0': { $exists: true },
					},
				},
				{
					$project: {
						_id: 1,
						secondarySchools: 1,
						activeSecondarySchools: 1,
						schoolsToRemove: 1,
					},
				},
			])
			.toArray();

		console.log(
			`Found ${usersToUpdate.length} users with secondary schools despite not being members of any rooms in those schools.`
		);

		for (const user of usersToUpdate) {
			const newSecondarySchools: ObjectId[] = user.activeSecondarySchools || [];

			console.log(`Updating user ${user._id.toString()}`);

			if (newSecondarySchools.length > 0) {
				await this.getCollection('users').updateOne(
					{ _id: user._id },
					{ $set: { secondarySchools: newSecondarySchools } }
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
