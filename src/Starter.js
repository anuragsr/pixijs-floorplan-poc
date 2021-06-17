import * as PIXI from 'pixi.js'
import { Viewport } from 'pixi-viewport'
import paralyzeTransformInheritance from "./utils/ignoreTransform";

import { l, cl, isMobile } from './utils/helpers'

export default class Starter {
  constructor(){
    const app = new PIXI.Application({
      antialias: true,
      height: window.innerHeight,
      width: window.innerWidth,
      backgroundColor: 0xffffff
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

    const container = new PIXI.Container()
    container.position.set(10, 10)
    viewport.addChild(container)

    const xMax = 23
      , yMax = 23
      , side = 64
      , gap = 100

    const bg = new PIXI.Sprite(PIXI.Texture.from('assets/bg-grid.jpg'))
    container.addChild(bg)

    bg.position.set(-side * 2, -side * 2)
    bg.height = viewport.worldHeight
    bg.width = viewport.worldWidth

    for (let i = 1; i <= xMax; i++){
      for (let j = 1; j <= yMax; j++){

        const group = new PIXI.Container()

        const desk = new PIXI.Container()
        group.addChild(desk)

        const sprite = new PIXI.Sprite(PIXI.Texture.WHITE)
        sprite.tint = 0xff0000
        sprite.width = side * 2
        sprite.height = side
        sprite.anchor.set(0.5)
        desk.addChild(sprite)

        const text = new PIXI.Text(`Desk ${i}-${j}`, { fill: "white", fontSize: 16 })
        text.position.set(-side, 14)
        desk.addChild(text)

        const infoBoxGroup = new PIXI.Container()
        infoBoxGroup.name = "InfoBox"
        infoBoxGroup.visible = false

        const infoBox =
          new PIXI.Graphics()
          .beginFill(0xffffff)
          .drawRoundedRect(0, 0, 170, 75, 5)
          .endFill()

        const triangle =
          new PIXI.Graphics()
          .beginFill(0xffffff)
          .drawPolygon(0, 0, 15, 15, 30, 0)
          .endFill()
        triangle.position.set(70, 75)

        const infoText = new PIXI.Text(`Desk ${i}-${j}`, { fill: "black", fontSize: 12 })
        infoText.position.set(5, 5)
        infoText.baseText = `Desk ${i}-${j}`

        infoBoxGroup.addChild(infoBox)
        infoBoxGroup.addChild(triangle)
        infoBoxGroup.addChild(infoText)

        // Keep scale and rotation (act more like HTML element)
        paralyzeTransformInheritance(infoBoxGroup, true, false)

        // Setting to center of desk
        infoBoxGroup.position.set(-85, -95)
        group.addChild(infoBoxGroup)

        const circ =
          new PIXI.Graphics()
            .lineStyle(1, 0x000000)
            .drawCircle(0, 0, 75)

        group.addChild(circ)

        const circCtrl =
          new PIXI.Graphics()
            .beginFill(0x000000)
            .drawCircle(0, -75, 10)
            .endFill()

        group.addChild(circCtrl)
        circCtrl.name = "Knob"

        group.position.set((j-1)*(side*2 + gap) + side, (i-1)*(side + gap) + side/2)
        !isMobile() && this.addListeners(group)
        container.addChild(group)
      }
    }

    // viewport border
    // const line = viewport.addChild(new PIXI.Graphics())
    // line.lineStyle(5, 0x000000).drawRect(-side*2, -side*2, viewport.worldWidth, viewport.worldHeight)
  }
  addListeners(group){
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
    // events for drag move
    .on('mousemove', onDragMove)
    .on('touchmove', onDragMove)

    function updateCoords(infoBox, data, parent){
      const pos = data.getLocalPosition(parent)
        , { pageX, pageY } = data.originalEvent
        , infoText = infoBox.getChildAt(2)

      infoText.text = `${infoText.baseText}\n{ X, Y } (Screen): ${pageX}, ${pageY}\n{ X, Y } (Relative): ${Math.round(pos.x)}, ${Math.round(pos.y)}`
    }

    function onDragStart(event){
      // store a reference to the data
      // the reason for this is because of multitouch
      // we want to track the movement of this particular touch
      event.stopPropagation()
      this.dragging = true
      this.data = event.data
      updateCoords(infoBox, this.data, this.parent)

      if(!this.showInfo) infoBox.visible = true
      this.showInfo = !this.showInfo
    }

    function onDragEnd(){
      this.dragging = false
      this.data = null
    }

    function onDragMove(){
      if (this.dragging){
        updateCoords(infoBox, this.data, this.parent)

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
      group.showInfo = false
    }

    const knob = group.getChildByName("Knob")
    knob.interactive = true
    knob
    .on("pointerdown", onRotateDown)
    .on("pointermove", onRotateMove)
    .on("pointerup", onRotateUp)
    .on("pointerupoutside", onRotateUp)

    function calcAngleRadians(x, y) { return Math.atan2(y, x) }
    function onRotateUp() { this.dragging = false }

    function onRotateDown(e) {
      e.stopPropagation()

      this.downCurrent = e.data.getLocalPosition(group.parent)
      this.startRotation = group.rotation;
      this.dragging = true;
    }

    function onRotateMove(e) {
      if (!this.dragging) return

      e.stopPropagation()
      const downNew = e.data.getLocalPosition(group.parent)
      , { downCurrent } = this
      // the drag point is relative to the display object x,y position on the stage (it's registration point)
      , relativeStartPoint = {
        x: downCurrent.x - group.x,
        y: downCurrent.y - group.y
      }
      , relativeEndPoint = {
        x: downNew.x - group.x,
        y: downNew.y - group.y
      }
      , endAngle = calcAngleRadians(relativeEndPoint.x , relativeEndPoint.y)
      , startAngle = calcAngleRadians(relativeStartPoint.x, relativeStartPoint.y)
      , deltaAngle = endAngle - startAngle
      , step = Math.PI/6
      // l(relativeStartPoint,relativeEndPoint)

      // group.rotation = this.startRotation + deltaAngle; // Continuous
      group.rotation = Math.round((this.startRotation + deltaAngle) / step) * step // Stepped
    }
  }
}
