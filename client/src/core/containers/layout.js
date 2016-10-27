import React from 'react';
import {render} from 'react-dom';
import {compose} from 'react-komposer';

import component from '../components/layout.jsx';

const composer = (props, onData) => {
	onData(null, {});
};

export default compose(composer)(component);
