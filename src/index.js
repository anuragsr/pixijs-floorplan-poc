import './styles/index.scss'

import $ from 'jquery'
import Main from './Main'
import { l, cl } from './utils/helpers'

$(() => {
  let st, et
  st = performance.now()
  l("Show loader")
  new Main().init()

  requestAnimationFrame(() => {
    et = performance.now()
    l(`${et - st} ms`)
    l("Hide loader")
    setTimeout(() => {
      $(".loader-ol").fadeOut(2000)
    }, 100)
  })
})
