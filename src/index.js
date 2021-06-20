import './styles/index.scss'

import $ from 'jquery'
import Main from './Main'
import { l, cl } from './utils/helpers'

$(() => { new Main().init() })
