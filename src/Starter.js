import * as PIXI from 'pixi.js'
import { Viewport } from 'pixi-viewport'
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

    const bg = new PIXI.Sprite(PIXI.Texture.from('assets/bg-mob.jpg'))
    container.addChild(bg)

    // bg.position.set(-side * 2, -side * 2)
    bg.height = viewport.worldHeight
    bg.width = viewport.worldWidth

    for (let i = 1; i <= xMax; i++){
      for (let j = 1; j <= yMax; j++){

        const group = new PIXI.Container()

        const sprite = new PIXI.Sprite(PIXI.Texture.WHITE)
        sprite.tint = 0xff0000
        sprite.width = side * 2
        sprite.height = side
        sprite.anchor.set(0.5)

        group.addChild(sprite)
        group.position.set((j-1)*(side*2 + gap) + side, (i-1)*(side + gap) + side/2)

        // !isMobile() && this.addListeners(sprite)
        // container.addChild(sprite)

        const text = new PIXI.Text(`Desk ${i}-${j}`, { fill: "white", fontSize: 16 })
        text.position.set(-side, 14)
        group.addChild(text)

        const infoBox =
          new PIXI.Graphics()
          .beginFill(0xffffff)
          .drawRoundedRect(0, 0, 170, 75, 5)
          .endFill()

        infoBox.position.set(-85, -95)
        infoBox.visible = false

        const triangle =
          new PIXI.Graphics()
          .beginFill(0xffffff)
          .drawPolygon(0, 0, 15, 15, 30, 0)
          .endFill()
        triangle.position.set(70, 75)

        const infoText = new PIXI.Text(`Desk ${i}-${j}`, { fill: "black", fontSize: 12 })
        infoText.position.set(5, 5)
        infoText.baseText = `Desk ${i}-${j}`

        // infoBox.interactive = false
        // infoBox.buttonMode = false
        infoBox.addChild(infoText)
        infoBox.addChild(triangle)
        group.addChild(infoBox)

        !isMobile() && this.addListeners(group)
        container.addChild(group)

        // infoBox.position.set((j-1)*(side*2 + gap), (i-1)*(side + gap) - 50)
        // // sprite.addChild(infoBox)
        // // infoBox.addChild(text)


        // const div = document.createElement('div')
        // div.classList.add("arrow_box")
        // div.innerText = "anurag"
        //
        // const parent = document.createElement('div')
        // parent.classList.add("ctn-arrow-box")
        //
        // parent.appendChild(div)
        // document.body.appendChild(parent)
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
      const { pageX, pageY } = event.data.originalEvent
      // l( event.data.originalEvent )


      this.data = event.data
      const localPoint = this.data.getLocalPosition(this.parent)
      // l( this.data.getLocalPosition(this.parent) )

      const infoText = this.getChildAt(2).getChildAt(0)
      infoText.text =
        infoText.baseText
        + "\n{ X, Y } (Screen): " + pageX + ", " + pageY
        + "\n{ X, Y } (Relative): " + Math.round(localPoint.x) + ", " + Math.round(localPoint.y)

      // this.alpha = 0.5
      this.dragging = true

      if(!this.showInfo) this.getChildAt(2).visible = true
      else this.getChildAt(2).visible = false

      this.showInfo = !this.showInfo

    }

    function onDragEnd(){
      // this.alpha = 1
      this.dragging = false
      // set the interaction data to null
      this.data = null
    }

    function onDragMove(){
      if (this.dragging){
        const { pageX, pageY } = this.data.originalEvent
        // l( event.data.originalEvent )

        const newPosition = this.data.getLocalPosition(this.parent)

        const infoText = this.getChildAt(2).getChildAt(0)
        infoText.text =
          infoText.baseText
          + "\n{ X, Y } (Screen): " + pageX + ", " + pageY
          + "\n{ X, Y } (Relative): " + Math.round(newPosition.x) + ", " + Math.round(newPosition.y)

        this.position.x = newPosition.x
        this.position.y = newPosition.y
      }
    }

  }
}
