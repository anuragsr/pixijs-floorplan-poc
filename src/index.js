import 'normalize.css/normalize.css'
import './styles/index.scss'

import $ from 'jquery'
import Starter from './Starter'
import { l, cl } from './utils/helpers'

$(() => { new Starter().init() })
