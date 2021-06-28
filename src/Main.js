import $ from 'jquery'
import * as PIXI from 'pixi.js'
import { Viewport } from 'pixi-viewport'
// import * as dat from 'dat.gui'

import paralyzeTransformInheritance from './utils/ignoreTransform'
import { l, cl, isMobile } from './utils/helpers'

class Arrow extends PIXI.Graphics{
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

    this.zIndex = 1
    this.sortableChildren = true
    this.interactive = true
    this.visible = false
    this.cursor = 'move'
    this.oldR = 0
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
    this.zIndex = 1
  }
  draw(){
    const arrUp = new Arrow(0x7290ce)
      , arrDown = new Arrow(0xf19875)
      , dot = new PIXI.Graphics().lineStyle(1, 0x000000).beginFill(0xffffff).drawCircle(0, 0, 5)

    arrDown.rotation = Math.PI/2
    this.addChild(arrUp, arrDown, dot)
  }
}
class TextOutline extends PIXI.Graphics{
  constructor(opts) {
    super()
    this.pos        = opts.pos || { x: 0, y: 0 }
    this.color      = opts.color || 0x000000
    this.textString = opts.textString || 'Sample'
    this.textStyle  = opts.textStyle || null
    this.padding = 10
    this.draw()
    this.addListeners()
  }
  draw(){
    const { textString, textStyle, pos, padding } = this
      , textMeasure = PIXI.TextMetrics.measureText(textString, textStyle)
      , { height, width } = textMeasure

    this.clear()
      .lineStyle(1, this.color, 1)
      .beginFill(this.color, .1)
      // .drawRect(0, 0, width + padding, height + padding)
      .drawRect(-(width + padding)/2, -(height + padding)/2, width+padding, height+padding)

    // this.position.set(pos.x - (width + padding)/2, pos.y - (height + padding)/2)
    this.position.set(pos.x, pos.y)
  }
  addListeners(){
    this.zIndex = 1
    // textControls.sortableChildren = true
    this.interactive = true
    this.buttonMode = true
    this.visible = false
    this.cursor = 'move'
  }
}

const xMax = 23
  , yMax = 23
  , side = 64
  , gap = 100
  // , opts = { showInfoBox: false }
  , textResolution = 3
  , textString = 'Text Here'
  , textStyle = new PIXI.TextStyle({ fontSize: 24, strokeThickness: .5 })

export default class Main {
  constructor(){
    PIXI.settings.PRECISION_FRAGMENT = 'highp'
    const app = new PIXI.Application({
      antialias: true,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0xfffff0,
      view: document.getElementById("canvas")
    })
    app.renderer.roundPixels = true

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
    this.viewport = viewport

    // Add the viewport to the stage
    app.stage.addChild(viewport)

    // Activate plugins
    viewport
    .drag()
    .pinch()
    .wheel()
    // .decelerate()

    // const gui = new dat.GUI()
    // gui.add(opts, 'showInfoBox')

    // Group to contain selected
    this.currGroup = []

    // View / Edit mode
    this.currMode = 'edit'
    // this.currMode = 'view'

    // Config obj for text addition
    this.textConfig = {
      // add text button
      btn: $("#add-txt"),
      // element containing the input
      el: $("#ctn-txt-inp"),
      // input
      inp: $("#ctn-txt-inp input"),
      // Adding text
      add: false,
      // Current text group
      curr: null,
      // Controls
      controls: null
    }

    // Group to contain text
    this.currTextGroup = []
  }
  init(){
    // Default container
    this.drawContainer()
    // Global Listeners
    this.addGlobalListeners()
    // Controls for single/multiple selection
    this.createControls()
    // Controls for text
    this.createTextControls()
    // Drawing Desk Grid
    this.drawDesks()
  }
  drawContainer(){
    const { viewport } = this
      , ctn = new PIXI.Container()

    // ctn.position.set(10, 10)
    ctn.interactive = true
    ctn.sortableChildren = true
    ctn.name = "Main"
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
  addGlobalListeners(){
    const { ctn, viewport } = this, self = this

    // Events on the PIXI scene
    ctn
    .on("pointerdown", this.clearGroup.bind(this))
    .on("pointerdown",  this.clearText.bind(this))
    .on("pointerdown",                  onCtnDown)
    // .on("pointerup", onCtnMoveEnd)
    // .on("pointermove",  onCtnMove)

    // function onCtnMoveEnd(e){
    //   // if(e.target.name !== "Main") return
    //
    //   this.dragging = false
    //   this.data = null
    //   // if(!this.dragged){ self.clearGroup() }
    // }
    // function onCtnMove(){
    //   // if (this.dragging){
    //   //   this.dragged = true
    //   //   // updateCoords(infoBox, this.data, this.parent)
    //   //
    //   //   // const pos = this.data.getLocalPosition(this.parent)
    //   //   // this.position.x = pos.x
    //   //   // this.position.y = pos.y
    //   // } else{
    //   //   // this.dragged = false
    //   // }
    // }

    function onCtnDown(e){
      // this.dragging = true
      const pos = e.data.getLocalPosition(this.parent), { add } = self.textConfig
      // Add text
      if(add){
        const text = new PIXI.Text(textString, textStyle)
        text.anchor.set(.5)
        text.resolution = textResolution
        text.position.set(pos.x, pos.y)
        text.interactive = true
        text.buttonMode = true
        ctn.addChild(text)

        text.on('pointerdown', onDragStart)
        function onDragStart(event){
          event.stopPropagation()
          self.selectText(this)
        }

        self.selectText(text)
        self.currTextGroup.push(text)

        self.textConfig.add = false
        ctn.cursor = 'default'
      }
    }

    viewport.on("moved", onViewportMove)

    function onViewportMove(e) {
      const { el, curr } = self.textConfig
      if(curr){
        const newPos = curr.toGlobal({x: 0, y: 0})
        el.css({ left: newPos.x, top: newPos.y })
      }
    }
  }
  drawDesks(){
    for (let i = 1; i <= xMax; i++){
      for (let j = 1; j <= yMax; j++){
        const group = new PIXI.Container()
        group.zIndex  = 0

        // Add desk
        group.addChild(this.createDesk(j, i))

        // Add InfoBox
        group.addChild(this.createInfoBox(j, i))

        // Add Listeners
        !isMobile() && this.addListeners(group)

        group.position.set((j-1)*(side*2 + gap) + side, (i-1)*(side + gap) + side/2)
        this.ctn.addChild(group)
      }
    }
  }
  createDesk(j, i){
    const desk = new PIXI.Container()
      , sprite = new PIXI.Sprite(PIXI.Texture.WHITE)
      , text = new PIXI.Text(`Desk ${i}-${j}`, { fontSize: 18, strokeThickness: .5 })

    sprite.tint = 0xd7d7d6
    sprite.width = side * 2
    sprite.height = side
    sprite.anchor.set(0.5)
    desk.addChild(sprite)

    text.position.set(-side, 14)
    text.resolution = textResolution
    desk.addChild(text)

    desk.name = "Desk"
    return desk
  }
  createInfoBox(j, i){
    const infoBoxGroup = new PIXI.Container()
      , infoBox = new PIXI.Graphics()
      , triangle = new PIXI.Graphics()
      , infoText = new PIXI.Text(`Desk ${i}-${j}`, { fill: "black", fontSize: 14, strokeThickness: .5 })

    infoBox
      .beginFill(0xffffff)
      .drawRoundedRect(0, 0, 190, 75, 5)

    triangle
      .beginFill(0xffffff)
      .drawPolygon(0, 0, 15, 15, 30, 0)
    triangle.position.set(80, 75)

    infoText.position.set(5, 5)
    infoText.resolution = 1.15
    infoText.baseText = `Desk ${i}-${j}`

    infoBoxGroup.addChild(infoBox, triangle, infoText)

    // Keep scale and rotation (act more like HTML element)
    paralyzeTransformInheritance(infoBoxGroup, true, false)

    // Setting to center of desk
    infoBoxGroup.position.set(-95, -95)
    infoBoxGroup.name = "InfoBox"
    infoBoxGroup.visible = false
    return infoBoxGroup
  }
  createControls(){
    const { ctn, currGroup } = this

    // Rotate indicator for multiple selection
    const controls = new RotateInd(75, .1)
    // Move indicator for multiple selection
      , arrGr = new TranslateInd()

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

      switch(this.action){
        // Rotate
        case 'Rotate':
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

          // this.rotation = this.startRotation + deltaAngle; // Continuous
          this.rotation = Math.round((this.startRotation + deltaAngle) / step) * step // Stepped

          const diffR = this.rotation - this.oldR
          if(diffR !== 0) {
            cl()
            currGroup.forEach((child, idx) => {
              child.rotation+= diffR

              // Below portion can be skipped if child needs to only rotate on its axis
              // Rotating point {child.x, child.y} around {this.x, this.y} by {diffR} radians
              // This gives a new position
              const newX = ((child.x - this.x) * Math.cos(diffR)) - ((child.y - this.y) * Math.sin(diffR)) + this.x
                , newY = ((child.x - this.x) * Math.sin(diffR)) + ((child.y - this.y) * Math.cos(diffR)) + this.y

              l(
                "Child:", idx, child.getChildByName("Desk").getChildAt(1).text, '\n',
                "Controls:", this.x, this.y, '\n',
                "Angle:", this.rotation, '\n',
                "Diff in Angle:", diffR, '\n',
                "World:", child.x, child.y, '\n',
                "New World:", newX, newY, '\n',
              )

              child.x = newX
              child.y = newY
            })

            // Storing current value as previous for next rotate event
            this.oldR = this.rotation
          }
          break;

        // Translate
        default:
          if (this.dragging){
            // updateCoords(infoBox, this.data, this.parent)

            const pos = e.data.getLocalPosition(this.parent)
            this.x = pos.x
            this.y = pos.y

            cl()
            currGroup.forEach((child, idx) => {
              // Calculate delta in x, y of controls
              const diffX = this.x - this.oldX, diffY = this.y - this.oldY

              l(
                "Child:", idx, child.getChildByName("Desk").getChildAt(1).text, '\n',
                "Controls:", this.x, this.y, '\n',
                "Child:", child.x, child.y, '\n',
                "Delta:", diffX, diffY, '\n',
                "New:", child.x + diffX, child.y + diffY, '\n',
              )

              // Add same to each child for updating its position
              child.x+= diffX
              child.y+= diffY
            })

            // Storing current values as previous for next move event
            this.oldX = this.x
            this.oldY = this.y
          }
          break;
      }
    }

    function onControlsUp(){
      this.dragging = false
      this.data = null
      this.action = null
    }
  }
  clearGroup(){
    const { controls, currGroup } = this
    currGroup.forEach(child => {
      child.zIndex = 0
      child.interactive = true
      child.getChildByName("Desk").getChildAt(0).tint = 0xd7d7d6
    })
    currGroup.length = 0
    controls.rotation = 0
    controls.oldR = 0
    controls.visible = false
  }
  addListeners(group){
    const { controls, currGroup } = this, self = this

    group.interactive = true
    group.buttonMode = true

    group
    .on('pointerdown',    onDragStart)
    .on('pointerup',        onDragEnd)
    .on('pointerupoutside', onDragEnd)
    // .on('touchend',         onDragEnd)
    // .on('touchendoutside',  onDragEnd)
    // .on('pointermove', onDragMove)

    function updateCoords(infoBox, data, parent){
      const pos = data.getLocalPosition(parent)
        , { pageX, pageY } = data.originalEvent
        , infoText = infoBox.getChildAt(2)

      infoBox.visible = true
      infoText.text = `${infoText.baseText}\n{ X, Y } (Screen): ${pageX}, ${pageY}\n{ X, Y } (Relative): ${Math.round(pos.x)}, ${Math.round(pos.y)}`
    }

    function addToGroup(el){
      controls.visible = true

      // Add child to group array
      el.zIndex = 1
      el.interactive = false
      el.getChildByName("Desk").getChildAt(0).tint = 0xfff000
      currGroup.push(el)

      // Get center of group
      let groupX = 0, groupY = 0
      currGroup.forEach(child => {
        groupX += child.x
        groupY += child.y
      })
      groupX /= currGroup.length
      groupY /= currGroup.length

      // Set controls at new center
      controls.x = groupX
      controls.y = groupY

      // Storing old values for next move
      controls.oldX = groupX
      controls.oldY = groupY
    }

    function onDragStart(event){
      // store a reference to the data
      // the reason for this is because of multitouch
      // we want to track the movement of this particular touch
      event.stopPropagation()
      this.dragging = true
      this.data = event.data

      switch(self.currMode){
        case 'edit':
          if(!(
            event.data.originalEvent.ctrlKey // Ctrl Key
            || event.data.originalEvent.metaKey // CMD for Mac
          )) { self.clearGroup() } // Clear current group if not multi-select

          addToGroup(this)
          break;

        default: // view
          // Show info window
          updateCoords(infoBox, this.data, this.parent)
          break;
      }
    }

    function onDragEnd(){
      this.dragging = false
      this.data = null
    }

    const infoBox = group.getChildByName("InfoBox")
    infoBox.interactive = true

    infoBox.on('pointerdown', hideInfoBox)
      // .on('touchstart', hideInfoBox)

    function hideInfoBox(e){
      e.stopPropagation()
      this.visible = false
    }
  }
  clearText(){
    const { curr, el, controls } = this.textConfig

    // Previous values cleared
    if(curr){ curr.interactive = true }
    controls.visible = false
    el.css({ visibility: "hidden" })
  }
  selectText(el){
    const { inp, el: arrowBox, controls } = this.textConfig

    this.clearText()

    el.zIndex = 1
    el.interactive = false

    this.textConfig.curr = el

    controls.visible = true
    controls.textString = el.text
    controls.pos = { x: el.x, y: el.y }
    controls.draw()

    // Storing old values for next move
    controls.oldX = el.x
    controls.oldY = el.y

    // Set text input position
    const newPos = el.toGlobal({x: 0, y: 0})
    arrowBox.css({ visibility: "visible", left: newPos.x, top: newPos.y })
    inp.val(el.text)
  }
  createTextControls(){
    const { ctn } = this, self = this
      , { btn, inp } = this.textConfig

    // DOM events
    // Add text button
    btn.on("click", () => {
      this.clearText()
      this.textConfig.add = true
      ctn.cursor = 'crosshair'
    })

    // Input change listener
    inp.on("input", function(e) {
      const { curr, controls } = self.textConfig

      curr.text = $(this).val()
      controls.textString = $(this).val()
      controls.pos = curr.position
      controls.draw()
    })

    // View / Edit mode
    $(`input[name=btnradio][value=${this.currMode}]`).attr('checked', 'checked')
    $(".btn-check").on("change", () => {
      this.currMode = $('input[name=btnradio]:checked').val()
      this.clearGroup()
      this.clearText()
      this.currTextGroup.forEach((text, index) => {
        text.interactive = this.currMode === 'view' ? false : true
      })
    })

    // Controls for Text
    const textControls = new TextOutline({
      color: 0x000000, textString, textStyle, pos: { x: 0, y: 0 }
    })
    ctn.addChild(textControls)
    this.textConfig.controls = textControls

    textControls
      .on("pointerdown",    onDown)
      .on("pointermove",    onMove)
      .on("pointerup",        onUp)
      .on("pointerupoutside", onUp)
      .on('touchend',         onUp)

    function onDown(e) {
      e.stopPropagation()
      this.dragging = true
    }

    function onMove(e) {
      if (!this.dragging) return
      e.stopPropagation()

      if (this.dragging){
        const { curr, el } = self.textConfig
          , pos = e.data.getLocalPosition(this.parent)

        this.x = pos.x
        this.y = pos.y

        const diffX = this.x - this.oldX, diffY = this.y - this.oldY
        curr.x+= diffX
        curr.y+= diffY

        // Set text input position
        const newPos = curr.toGlobal({x: 0, y: 0})
        el.css({ left: newPos.x, top: newPos.y })

        // Storing current values as previous for next move event
        this.oldX = this.x
        this.oldY = this.y
      }
    }

    function onUp(){ this.dragging = false }
  }
}
