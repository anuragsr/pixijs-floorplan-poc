import { l, cl } from './helpers'

export default class GUI{
  constructor(){

  }
  getParams(currMesh){
    return {
      helpers: true,
      getState: function () { l(this) },
      currMesh: currMesh?currMesh.name:"",
    }
  }
}
