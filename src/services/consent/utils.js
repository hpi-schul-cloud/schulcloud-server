const convertSelect = (select) => {
	const project = {};

	select.forEach((e) => {
		project[e] = true;
	});

	return project;
};


const stageAddConsentSortParam = (aggregation) => {
	aggregation.push({
		$addFields: {
			consentSortParam: {
				$switch: {
					branches: [
						{
							case: {
								$eq: ['$consentStatus', 'missing'],
							},
							then: 0,
						},
						{
							case: {
								$eq: ['$consentStatus', 'parentsAgreed'],
							},
							then: 1,
						},
						{
							case: {
								$eq: ['$consentStatus', 'ok'],
							},
							then: 2,
						},
					],
				},
			},
		},
	});
};

const getParentReducer = (type) => ({
	$reduce: {
		input: '$consent.parentConsents',
		initialValue: false,
		in: { $or: ['$$value', `$$this.${type}`] },

	},
});

const createConsentAggrigation = ({
	select, sort, limit = 25, skip = 0, consentStatus, ...match
}) => {
	// eslint-disable-next-line no-param-reassign
	limit = Number(limit);
	// eslint-disable-next-line no-param-reassign
	skip = Number(skip);

	const currentDate = new Date();
	const secondLevel = new Date();
	secondLevel.setFullYear(currentDate.getFullYear() - 16); // TODO: get age from default.conf
	const firstLevel = new Date();
	firstLevel.setFullYear(currentDate.getFullYear() - 14);

	const project = convertSelect(select);

	if (!select || select.includes('consentStatus')) {
		project.consentStatus = {
			$switch: {
				branches: [
					{
						case: {
							$or: [
								{
									$and: [
										{ $lte: ['$birthday', secondLevel] },
										{ $eq: ['$consent.userConsent.privacyConsent', true] },
										{ $eq: ['$consent.userConsent.termsOfUseConsent', true] },
									],
								},
								{
									$and: [
										{ $gt: ['$birthday', secondLevel] },
										{ $lte: ['$birthday', firstLevel] },
										{ $eq: ['$consent.userConsent.privacyConsent', true] },
										{ $eq: ['$consent.userConsent.termsOfUseConsent', true] },
										{ $eq: [getParentReducer('privacyConsent'), true] },
										{ $eq: [getParentReducer('termsOfUseConsent'), true] },
									],
								},
								{
									$and: [
										{ $gt: ['$birthday', firstLevel] },
										{ $eq: [getParentReducer('privacyConsent'), true] },
										{ $eq: [getParentReducer('termsOfUseConsent'), true] },
									],
								},

							],
						},
						then: 'ok',

					},
					{
						case: {
							$and: [
								{ $gt: ['$birthday', secondLevel] },
								{ $lte: ['$birthday', firstLevel] },
								{ $eq: [getParentReducer('privacyConsent'), true] },
								{ $eq: [getParentReducer('termsOfUseConsent'), true] },
							],
						},
						then: 'parentsAgreed',
					},
				],
				default: 'missing',
			},
		};
	}

	const aggregation = [];

	if (match) {
		aggregation.push({
			$match: match,
		});
	}

	if (select) {
		aggregation.push({
			$project: project,
		});
	}

	if (consentStatus) {
		let list = [];
		if (Array.isArray(consentStatus)) {
			list = consentStatus;
		} else if (Array.isArray(consentStatus.$in)) {
			list = consentStatus.$in;
		} else if (typeof consentStatus === 'string') {
			list = [consentStatus];
		}
		aggregation.push({
			$match: {
				consentStatus: {
					$in: list,
				},
			},
		});
		/* aggregation.push({
			match: {
				$in: ['$consentStatus', list],
			},
		}); */
	}

	if (sort) {
		const mSort = {};
		for (const k in sort) {
			if (({}).hasOwnProperty.call(sort, k)) mSort[k] = Number(sort[k]);
		}

		if (typeof sort === 'object' && ({}).hasOwnProperty.call(sort, 'consentStatus')) {
			mSort.consentSortParam = sort.consentStatus;
			delete mSort.consentStatus;
			stageAddConsentSortParam(aggregation);
		}
		aggregation.push({
			$sort: mSort,
		});
	}

	aggregation.push({
		$facet: {
			data: [
				{
					$skip: skip,
				},
				{
					$limit: limit,
				},
			],
			total: [{
				$count: 'count',
			}],
		},
	});

	aggregation.push({
		$project: {
			total: {
				$reduce: {
					input: '$total',
					initialValue: 0,
					in: { $add: ['$$value', '$$this.count'] },
				},
			},
			data: true,
		},
	});

	aggregation.push({
		$addFields: {
			limit,
			skip,
		},
	});


	return aggregation;
};


const createConsentFilterQuery = (...status) => {
	const currentDate = new Date();
	const secondConsentSwitchDate = new Date();
	secondConsentSwitchDate.setFullYear(currentDate.getFullYear() - 16); // TODO: get age from default.conf
	const firstConsentSwitchDate = new Date();
	firstConsentSwitchDate.setFullYear(currentDate.getFullYear() - 14);

	const requiredConsents = {
		privacyConsent: true,
		termsOfUseConsent: true,
	};

	const missingConsents = {
		$or: [
			{ privacyConsent: false },
			{ termsOfUseConsent: false },
		],
	};

	const orConditions = status.reduce((query, status) => {
		if (status === 'missing') {
			query.push({
				consent: {
					userConsent: missingConsents,
				},
				birthday: {
					$gte: secondConsentSwitchDate,
				},
			});
			query.push({
				consent: {
					parentConsents: missingConsents,
				},
				birthday: {
					$gt: firstConsentSwitchDate,
					$lte: secondConsentSwitchDate,
				},
			});
			query.push({
				consent: {
					parentConsents: missingConsents,
				},
				birthday: {
					$lt: firstConsentSwitchDate,
				},
			});
		} else if (status === 'parentAgree') {
			query.push({
				consent: {
					userConsent: missingConsents,
					parentConsents: requiredConsents,
				},
				birthday: {
					$gt: firstConsentSwitchDate,
					$lte: secondConsentSwitchDate,
				},
			});
		} else if (status === 'ok') {
			query.push({
				consent: {
					userConsent: requiredConsents,
				},
				birthday: {
					$gte: secondConsentSwitchDate,
				},
			});
			query.push({
				consent: {
					userConsent: requiredConsents,
					parentConsents: requiredConsents,
				},
				birthday: {
					$gt: firstConsentSwitchDate,
					$lte: secondConsentSwitchDate,
				},
			});
			query.push({
				consent: {
					parentConsents: requiredConsents,
				},
				birthday: {
					$lt: firstConsentSwitchDate,
				},
			});
		}
	}, []);

	return {
		$or: orConditions,
	};
};


const userToConsent = (user) => ({
	_id: user._id,
	userId: user._id,
	requiresParentConsent: user.requiresParentConsent,
	consentStatus: user.consentStatus,
	...user.consent,
});

const modifyDataForUserSchema = (data) => ({
	consent: {
		...data,
	},
});

module.exports = {
	createConsentAggrigation,
	createConsentFilterQuery,
	userToConsent,
	modifyDataForUserSchema,
};
