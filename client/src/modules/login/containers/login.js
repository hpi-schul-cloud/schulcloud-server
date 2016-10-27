import React from 'react';
import {render} from 'react-dom';
import {compose} from 'react-komposer';

import component from '../components/login';
import actions from '../actions/login';

const composer = (props, onData) => {
	onData(null, {
		actions
	});
};

export default compose(composer)(component);
