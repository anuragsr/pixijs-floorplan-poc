import * as PIXI from 'pixi.js'
import { Viewport } from 'pixi-viewport'
import * as dat from 'dat.gui'

import paralyzeTransformInheritance from './utils/ignoreTransform'
import { l, cl, isMobile, getMaxRadius, getDistance } from './utils/helpers'

class Arrow extends PIXI.Graphics {
  constructor(color) {
    super()
    this.color = color || 0x000000
    this.draw()
  }

  draw(){
    this.clear()
    .lineStyle(3, this.color, 1)
    .moveTo(0, 0)
    .lineTo(0, -40)
    .moveTo(-10, -30)
    .lineTo(0, -40)
    .lineTo(10, -30)
  }
}
class RotateInd extends PIXI.Container{
  constructor(radius, alpha) {
    super()
    const alphaVal = alpha || 0
    this.draw(radius, alphaVal)
  }
  draw(radius, alpha){
    this.children.length = 0
    const circ = new PIXI.Graphics().lineStyle(1, 0x000000).beginFill(0x000000, alpha).drawCircle(0, 0, radius)
      , knob = new PIXI.Graphics().lineStyle(2, 0x000000).beginFill(0xffffff).drawCircle(0, -radius, 7)

    circ.zIndex = 1
    knob.zIndex = 1

    knob.name = "Knob"
    knob.interactive = true
    knob.buttonMode = true
    this.addChild(circ, knob)
  }
}
class TranslateInd extends PIXI.Container{
  constructor() {
    super()
    this.draw()
  }
  draw(){
    const arrUp = new Arrow(0x7290ce)
      , arrDown = new Arrow(0xf19875)
      , dot = new PIXI.Graphics().lineStyle(1, 0x000000).beginFill(0xffffff).drawCircle(0, 0, 5)

    arrDown.rotation = Math.PI/2
    this.addChild(arrUp, arrDown, dot)
  }
}

const xMax = 23
  , yMax = 23
  , side = 64
  , gap = 100
  , opts = { showInfoBox: false }

export default class Starter {
  constructor(){
    const app = new PIXI.Application({
      antialias: true,
      height: window.innerHeight,
      width: window.innerWidth,
      backgroundColor: 0xfffff0
    })
    document.body.appendChild(app.view)

    // create viewport
    const viewport = new Viewport({
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      // worldWidth: 4096 * 3.75,
      // worldHeight: 4096 * 2.75,
      worldWidth: 4096 * 1.35,
      worldHeight: 4096,
      // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
      interaction: app.renderer.plugins.interaction
    })

    this.app = app
    this.viewport = viewport
  }
  init(){
    const { app, viewport } = this, { stage } = app
    // add the viewport to the stage
    stage.addChild(viewport)
    // activate plugins
    viewport
      .drag()
      .pinch()
      .wheel()
      // .decelerate()

    // const gui = new dat.GUI()
    // gui.add(opts, 'showInfoBox')

    // Default container
    this.drawMainContainer()

    // Controls for single/multiple selection
    this.createControls()

    // Drawing Desk Grid
    this.drawDesks()

  }
  drawMainContainer(){
    const { viewport } = this
    const ctn = new PIXI.Container()
    // ctn.position.set(10, 10)
    ctn.sortableChildren = true
    viewport.addChild(ctn)
    this.ctn = ctn

    // Background Image
    const bg = new PIXI.Sprite(PIXI.Texture.from('assets/bg-grid.jpg'))
    // bg.position.set(-side * 2, -side * 2)
    bg.height = viewport.worldHeight
    bg.width = viewport.worldWidth
    ctn.addChild(bg)

    // viewport border
    // const line = viewport.addChild(new PIXI.Graphics())
    // line.lineStyle(5, 0x000000).drawRect(-side*2, -side*2, viewport.worldWidth, viewport.worldHeight)
  }
  drawMultiContainer(){
    const { viewport } = this
    const multiCtn = new PIXI.Container()
    multiCtn.position.set(10, 10)
    multiCtn.sortableChildren = true
    viewport.addChild(multiCtn)
    this.multiCtn = multiCtn

    // Move indicator for multiple selection
    const arrGr = new TranslateInd()
    arrGr.zIndex = 1
    arrGr.visible = false
    multiCtn.addChild(arrGr)
    this.arrGr = arrGr

    // Rotate indicator for multiple selection
    const rotGr = new RotateInd(100, .1)
    rotGr.zIndex = 1
    rotGr.visible = false
    rotGr.cursor = 'move'
    multiCtn.addChild(rotGr)
    this.rotGr = rotGr

    // Events on rotate indicator
    rotGr
    // events for drag start
    .on('mousedown', onDragStart)
    .on('touchstart', onDragStart)
    // events for drag end
    .on('mouseup', onDragEnd)
    // .on('mouseupoutside', onDragEnd)
    .on('touchend', onDragEnd)
    // .on('touchendoutside', onDragEnd)
    // events for drag move
    .on('mousemove', onDragMove)
    .on('touchmove', onDragMove)

    function onDragStart(event){
      event.stopPropagation()
      this.dragging = true
      this.data = event.data
      this.grouped = multiCtn.children.filter(child => child.name === "DeskGroup")
    }

    function onDragEnd(){
      this.dragging = false
      this.data = null
      this.grouped = null
    }

    function onDragMove(){
      if (this.dragging){
        const pos = this.data.getLocalPosition(this.parent)
        this.x = pos.x
        this.y = pos.y
        arrGr.x = pos.x
        arrGr.y = pos.y
        // multiCtn.x = pos.x
        // multiCtn.y = pos.y
        // this.grouped.forEach(child => {
        //   child.x = pos.x
        //   child.y = pos.y
        // })
      }
    }
  }
  drawDesks(){
    for (let i = 1; i <= xMax; i++){
      for (let j = 1; j <= yMax; j++){
        const group = new PIXI.Container()
        group.name    = "DeskGroup"
        group.zIndex  = 0

        // Add desk
        group.addChild(this.createDesk(j, i))

        // // Transforms
        // group.addChild(this.createTransformInds())

        // InfoBox
        group.addChild(this.createInfoBox(j, i))

        // Listeners
        !isMobile() && this.addListeners(group)

        group.position.set((j-1)*(side*2 + gap) + side, (i-1)*(side + gap) + side/2)
        this.ctn.addChild(group)
      }
    }
  }
  createDesk(j, i){
    const desk = new PIXI.Container()
      , sprite = new PIXI.Sprite(PIXI.Texture.WHITE)
      , text = new PIXI.Text(`Desk ${i}-${j}`, { fill: 0x000000, fontSize: 16 })

    sprite.tint = 0xd7d7d6
    sprite.width = side * 2
    sprite.height = side
    sprite.anchor.set(0.5)
    desk.addChild(sprite)

    text.position.set(-side, 14)
    desk.addChild(text)

    desk.name = "Desk"
    return desk
  }
  createTransformInds() {
    const transformGr = new PIXI.Container()
      // Rotation controls
      , rotGr = new RotateInd(75)
      // Directional Arrows
      , arrGr = new TranslateInd()

    transformGr.name = "TransCtrl"
    transformGr.visible = false
    transformGr.addChild(rotGr, arrGr)
    return transformGr
  }
  createInfoBox(j, i){
    const infoBoxGroup = new PIXI.Container()
      , infoBox = new PIXI.Graphics()
      , triangle = new PIXI.Graphics()
      , infoText = new PIXI.Text(`Desk ${i}-${j}`, { fill: "black", fontSize: 12 })

    infoBox
      .beginFill(0xffffff)
      .drawRoundedRect(0, 0, 170, 75, 5)
      .endFill()

    triangle
      .beginFill(0xffffff)
      .drawPolygon(0, 0, 15, 15, 30, 0)
      .endFill()
    triangle.position.set(70, 75)

    infoText.position.set(5, 5)
    infoText.baseText = `Desk ${i}-${j}`

    infoBoxGroup.addChild(infoBox, triangle, infoText)

    // Keep scale and rotation (act more like HTML element)
    paralyzeTransformInheritance(infoBoxGroup, true, false)

    // Setting to center of desk
    infoBoxGroup.position.set(-85, -95)
    infoBoxGroup.name = "InfoBox"
    infoBoxGroup.visible = false
    return infoBoxGroup
  }
  createControls(){
    const { ctn } = this

    // Rotate indicator for multiple selection
    const controls = new RotateInd(75, .1)
    controls.zIndex = 1
    controls.sortableChildren = true
    controls.interactive = true
    controls.visible = false
    controls.cursor = 'move'

    // Move indicator for multiple selection
    const arrGr = new TranslateInd()
    arrGr.zIndex = 1

    controls.addChild(arrGr)
    ctn.addChild(controls)
    this.controls = controls

    controls
      .on("pointerdown", onControlsDown)
      .on("pointermove", onControlsMove)
      .on("pointerup", onControlsUp)
      .on("pointerupoutside", onControlsUp)
      .on('touchend', onControlsUp)

    function calcAngleRadians(x, y) { return Math.atan2(y, x) }

    function onControlsDown(e) {
      // l(e.target)
      e.stopPropagation()
      this.downCurrent = e.data.getLocalPosition(this.parent)
      this.startRotation = this.rotation;
      this.dragging = true;
      if(e.target.name === "Knob") this.action = "Rotate"
      else this.action = "Move"
    }

    function onControlsMove(e) {
      if (!this.dragging) return
      e.stopPropagation()

      // Rotate Code
      if(this.action === "Rotate"){
        const downNew = e.data.getLocalPosition(this.parent)
          , { downCurrent } = this
          // the drag point is relative to the display object x,y position on the stage (it's registration point)
          , relativeStartPoint = {
            x: downCurrent.x - this.x,
            y: downCurrent.y - this.y
          }
          , relativeEndPoint = {
            x: downNew.x - this.x,
            y: downNew.y - this.y
          }
          , endAngle = calcAngleRadians(relativeEndPoint.x , relativeEndPoint.y)
          , startAngle = calcAngleRadians(relativeStartPoint.x, relativeStartPoint.y)
          , deltaAngle = endAngle - startAngle
          , step = Math.PI/4
        // l(relativeStartPoint,relativeEndPoint)

        // group.rotation = this.startRotation + deltaAngle; // Continuous
        this.rotation = Math.round((this.startRotation + deltaAngle) / step) * step // Stepped
        // if(this.rotation < 0){
        //   this.rotation = 2* Math.PI + this.rotation
        // }

        cl()
        this.children
          .forEach((child, idx) => {
            if(child.name === "DeskGroup") {

              child.originalR = child.rotation + this.rotation

              // child.originalX = ((child.x - this.x) * Math.cos(this.rotation)) - ((child.y - this.y) * Math.sin(this.rotation)) + this.x
              // child.originalY = ((child.x - this.x) * Math.sin(this.rotation)) + ((child.y - this.y) * Math.cos(this.rotation)) + this.y
              // const newX = ((child.originalX - this.x) * Math.cos(this.rotation)) - ((child.originalY - this.y) * Math.sin(this.rotation)) + this.x
              //   , newY = ((child.originalX - this.x) * Math.sin(this.rotation)) + ((child.originalY - this.y) * Math.cos(this.rotation)) + this.y
              const local = child.toLocal({ x: 0, y: 0 }, this)
                , newX = local.x * Math.cos(this.rotation) - local.y * Math.sin(this.rotation)
                , newY = local.x * Math.sin(this.rotation) + local.y * Math.cos(this.rotation)

              // l(child.x, child.y, child.originalX, child.originalY)
              l("Child:", idx, child.getChildByName("Desk").getChildAt(1).text)
              // l(newX, newY)
              // child.originalX = newX
              // child.originalY = newY

              // const { x, y } = child.toGlobal({ x: 0, y: 0 })
              // l(x, y, this.x, this.y)
              // l(newX, newY, this.getGlobalPosition().x, this.getGlobalPosition().y)
              // l(child.toLocal({ x: 0, y: 0 }, this).x, child.toLocal({ x: 0, y: 0 }, this).y, this.x, this.y)
              // l(child.getGlobalPosition().x, child.getGlobalPosition().y, this.x, this.y)
              //
              child.originalX = this.x - newX
              child.originalY = this.y - newY

              l(
                " Local:", local.x, local.y, '\n',
                "Controls:", this.x, this.y, '\n',
                "Angle:", this.rotation, '\n',
                "New:", newX, newY, '\n',
                "Final:", child.originalX, child.originalY
              )
            }
          })

      } else {
        if (this.dragging){
          // updateCoords(infoBox, this.data, this.parent)

          const pos = e.data.getLocalPosition(this.parent)
          this.x = pos.x
          this.y = pos.y

          this.children
            .forEach(child => {
              if(child.name === "DeskGroup"){
                // Here since children may be negatively places wrt controls,
                // we keep original position by adding current positions
                // of group and controls
                child.originalX = child.x + this.x
                child.originalY = child.y + this.y
              }
            })
        }
      }
    }

    function onControlsUp(){
      this.dragging = false
      this.data = null
      this.action = null
    }
  }
  addListeners(group){
    const { ctn, controls } = this

    group.interactive = true
    group.buttonMode = true

    group
    // events for drag start
    .on('mousedown', onDragStart)
    .on('touchstart', onDragStart)
    // events for drag end
    .on('mouseup', onDragEnd)
    // .on('mouseupoutside', onDragEnd)
    .on('touchend', onDragEnd)
    // .on('touchendoutside', onDragEnd)
    // // events for drag move
    // .on('mousemove', onDragMove)
    // .on('touchmove', onDragMove)

    function updateCoords(infoBox, data, parent){
      const pos = data.getLocalPosition(parent)
        , { pageX, pageY } = data.originalEvent
        , infoText = infoBox.getChildAt(2)

      infoText.text = `${infoText.baseText}\n{ X, Y } (Screen): ${pageX}, ${pageY}\n{ X, Y } (Relative): ${Math.round(pos.x)}, ${Math.round(pos.y)}`
    }

    function clearAllSelected(){
      const mcn = rotGr.children.filter(child => child.name === "DeskGroup")
      for (let i = mcn.length - 1; i >= 0; i--) {
        ctn.addChild(mcn[i])
        // multiCtn.removeChild(mcn[i])
        rotGr.removeChild(mcn[i])
      }

      ctn.children.forEach(child => {
        child.selected = false

        const gr = child.getChildByName("TransCtrl")
        if(gr) gr.visible = false

        const desk = child.getChildByName("Desk")
        if(desk) desk.getChildAt(0).tint = 0xd7d7d6
      })

      l("Cleared: ", ctn.children.length, multiCtn.children.length)
    }

    function clearControls(){
      const mcn = controls.children.filter(child => child.name === "DeskGroup")
      for (let i = mcn.length - 1; i >= 0; i--) {
        controls.removeChild(mcn[i])
        mcn[i].x = mcn[i].originalX
        mcn[i].y = mcn[i].originalY
        mcn[i].rotation = mcn[i].originalR
        mcn[i].interactive = true
        mcn[i].getChildByName("Desk").getChildAt(0).tint = 0xd7d7d6
        ctn.addChild(mcn[i])
      }
      controls.rotation = 0
    }

    function onDragStart(event){
      controls.visible = true
      const cn = controls.children.filter(child => child.name === "DeskGroup")
      // store a reference to the data
      // the reason for this is because of multitouch
      // we want to track the movement of this particular touch
      event.stopPropagation()

      this.originalX = this.x
      this.originalY = this.y
      this.originalR = this.rotation
      this.getChildByName("Desk").getChildAt(0).tint = 0xfff000

      if(!cn.length){
        controls.addChild(this)
        controls.x = this.originalX
        controls.y = this.originalY
        this.x = 0
        this.y = 0
        this.interactive = false
      } else {
        if(event.data.originalEvent.ctrlKey){
          // Adding more to selection
          let cn = controls.children.filter(child => child.name === "DeskGroup")
            // Init with current selection coordinates
            , multiCtnX = this.x, multiCtnY = this.y
          // l(cn.length)

          // Add coords of existing children
          cn.forEach(child => {
            // l(child.x, child.y)
            multiCtnX += child.originalX
            multiCtnY += child.originalY
          })

          // Get center of group
          multiCtnX /= cn.length + 1
          multiCtnY /= cn.length + 1

          // Set controls at new center
          controls.x = multiCtnX
          controls.y = multiCtnY

          // Add to controls (this creates offset)
          controls.addChild(this)

          // Correct offset by looping over children
          controls.children
          .filter(child => child.name === "DeskGroup")
          .forEach(child => {
            child.getChildByName("Desk").getChildAt(0).tint = 0xfff000

            child.x = child.originalX - controls.x
            child.y = child.originalY - controls.y
            // child.rotation = 0
            child.interactive = false
          })
        } else {
          // Clear current controls and add this one
          clearControls()

          controls.addChild(this)
          controls.x = this.originalX
          controls.y = this.originalY
          this.x = 0
          this.y = 0
          this.interactive = false
        }
      }

      // l(multiCtn.children)
      // l("State: ", ctn.children.length, multiCtn.children.length)
      // let multiCtnX = this.x, multiCtnY = this.y
      // if(event.data.originalEvent.ctrlKey){
      //   // Multi select
      //   // Add current
      //   controls.addChild(this)
      //   // l(cn)
      //   // // multiCtn.addChild(this)
      //   // const oldX = this.x, oldY = this.y
      //   // rotGr.addChild(this)
      //   // this.x = rotGr.x - oldX
      //   // this.y = rotGr.y - oldY
      //   //
      //   // // Add the already selected one
      //   // const cn = ctn.children
      //   // for (let i = 0; i < cn.length; i++) {
      //   //   // if(cn[i].selected){ multiCtn.addChild(cn[i]); break; }
      //   //   if(cn[i].selected){
      //   //     const oldX = cn[i].x, oldY = cn[i].y
      //   //     cn[i].x = rotGr.x - oldX
      //   //     cn[i].y = rotGr.y - oldY
      //   //     rotGr.addChild(cn[i]);
      //   //
      //   //     break;
      //   //   }
      //   // }
      //   //
      //   // // const mcn = multiCtn.children.filter(child => child.name === "DeskGroup")
      //   // const mcn = rotGr.children.filter(child => child.name === "DeskGroup")
      //   //   // , pointsArr = []
      //   //
      //   // l(mcn.length)
      //   //
      //   // mcn.forEach(child => {
      //   //   l(child.x, child.y)
      //   //
      //   //   child.selected = false
      //   //   child.getChildByName("TransCtrl").visible = false
      //   //   child.getChildByName("Desk").getChildAt(0).tint = 0xfff000
      //   //
      //   //   // pointsArr.push({ x: child.x, y: child.y })
      //   //   // multiCtnX += child.x
      //   //   // multiCtnY += child.y
      //   // })
      //   //
      //   // // Get center of group
      //   // // multiCtnX /= mcn.length
      //   // // multiCtnY /= mcn.length
      //   //
      //   // arrGr.x = multiCtnX
      //   // arrGr.y = multiCtnY
      //   // arrGr.visible = true
      //   //
      //   // // // Get max radius for multi selection circle
      //   // // const r = getMaxRadius(multiCtnX, multiCtnY, pointsArr)
      //   // // rotGr.draw(1.5 * r, .1)
      //   // rotGr.x = multiCtnX
      //   // rotGr.y = multiCtnY
      //   // rotGr.visible = true
      // } else {
      //
      //   // clearAllSelected()
      //   // arrGr.visible = false
      //   // rotGr.visible = false
      //
      //   // if(!this.selected) {
      //   //   opts.showInfoBox && (infoBox.visible = true)
      //   //   // transformGr.visible = true
      //   // }
      //   // this.selected = !this.selected
      // }

      this.dragging = true
      this.data = event.data
      // updateCoords(infoBox, this.data, this.parent)
    }

    function onDragEnd(){
      // const mcn = multiCtn.children.filter(child => child.name === "DeskGroup")
      // if(mcn.length){
      //   rotGr.interactive = true
      // } else {
      //   rotGr.interactive = false
      // }
      this.dragging = false
      this.data = null
    }

    function onDragMove(){
      // const mcn = multiCtn.children.filter(child => child.name === "DeskGroup")
      // if(mcn.length) { this.dragging = false }

      if (this.dragging){
        // updateCoords(infoBox, this.data, this.parent)

        const pos = this.data.getLocalPosition(this.parent)
        this.position.x = pos.x
        this.position.y = pos.y
      }
    }

    const infoBox = group.getChildByName("InfoBox")
    infoBox.interactive = true

    infoBox
    .on('pointerdown', hideInfoBox)
    .on('touchstart', hideInfoBox)

    function hideInfoBox(e){
      e.stopPropagation()
      this.visible = false
      group.selected = false
    }

    // const transformGr = group.getChildByName("TransCtrl")
    // , knob = transformGr.getChildAt(0).getChildByName("Knob")

    // const knob = controls.getChildByName("Knob")

  }
}
