import { externallyManaged } from '.';

export default externallyManaged = async (ref, userId) => {
	const accounts = await ref.app.service('/accounts').find({
		query: {
			userId,
		},
	});
	return accounts.some((account) => !!account.systemId);
};
