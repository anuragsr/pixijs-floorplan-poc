import * as PIXI from 'pixi.js'
import { Viewport } from 'pixi-viewport'
import { l, cl, isMobile } from './utils/helpers'

export default class Starter {
  constructor(){
    const app = new PIXI.Application({
      antialias: false,
      height: window.innerHeight,
      width: window.innerWidth,
      backgroundColor: 0xffffff
    })
    document.body.appendChild(app.view)

    // create viewport
    const viewport = new Viewport({
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      worldWidth: 4096 * 3.75,
      worldHeight: 4096 * 2.75,
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

    const xMax = 64
      , yMax = 64
      , side = 64
      , gap = 100

    const bg = new PIXI.Sprite(PIXI.Texture.from('assets/bg-mob.jpg'))
    container.addChild(bg)

    bg.position.set(-side * 2, -side * 2)
    bg.height = viewport.worldHeight
    bg.width = viewport.worldWidth

    for (let i = 1; i <= xMax; i++){
      for (let j = 1; j <= yMax; j++){
        const sprite = new PIXI.Sprite(PIXI.Texture.WHITE)
        sprite.tint = 0xff0000
        sprite.width = side * 2
        sprite.height = side
        sprite.position.set((j-1)*(side*2 + gap) + side, (i-1)*(side + gap) + side/2)
        sprite.anchor.set(0.5)

        !isMobile() && this.addListeners(sprite)
        container.addChild(sprite)

        const text = new PIXI.Text(`Seat ${i}-${j}`, { fill: "white", fontSize: 16 })
        text.position.set((j-1)*(side*2 + gap), (i-1)*(side + gap))
        // text.anchor.set(0.5)
        container.addChild(text)
      }
    }

    // viewport border
    // const line = viewport.addChild(new PIXI.Graphics())
    // line.lineStyle(10, 0x00ff00).drawRect(0, 0, viewport.worldWidth, viewport.worldHeight)
  }
  addListeners(shape){
    shape.interactive = true
    shape.buttonMode = true

    // setup events
    shape
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
      // store a reference to the data
      // the reason for this is because of multitouch
      // we want to track the movement of this particular touch
      event.stopPropagation()
      this.data = event.data
      this.alpha = 0.5
      this.dragging = true
    }

    function onDragEnd(){
      this.alpha = 1
      this.dragging = false
      // set the interaction data to null
      this.data = null
    }

    function onDragMove(){
      if (this.dragging){
        const newPosition = this.data.getLocalPosition(this.parent)
        this.position.x = newPosition.x
        this.position.y = newPosition.y
      }
    }

  }
}
