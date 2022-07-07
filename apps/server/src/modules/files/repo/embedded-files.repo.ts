const query = [
	{
		$unwind: '$contents',
	},
	{
		$match: {
			'contents.component': {
				$eq: 'text',
			},
		},
	},
	{
		$match: {
			'contents.content.text': {
				$regex: /src="(https?:\/\/[^"]*)?\/files\/file\?/,
				$options: 'i',
			},
		},
	},
];
