import React from 'react';
import {render} from 'react-dom';
import { browserHistory, hashHistory, Router, Route, Link } from 'react-router'

import { Helpers } from './core';
import modules from './modules';

Helpers.Module.SetupModules(modules);

render(Helpers.Router.GetRouter(), document.getElementById('root'))
