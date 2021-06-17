import * as PIXI from 'pixi.js'

class ParalyzedInheritanceTransform extends PIXI.Transform {
  updateTransform(parentTransform) {
    const lt = this.localTransform;
    if (this._localID !== this._currentLocalID){
      // get the matrix values of the displayobject based on its transform properties..
      lt.a = this._cx * this.scale.x;
      lt.b = this._sx * this.scale.x;
      lt.c = this._cy * this.scale.y;
      lt.d = this._sy * this.scale.y;
      lt.tx = this.position.x - ((this.pivot.x * lt.a) + (this.pivot.y * lt.c));
      lt.ty = this.position.y - ((this.pivot.x * lt.b) + (this.pivot.y * lt.d));
      this._currentLocalID = this._localID;
      // force an update..
      this._parentID = -1;
    }

    if (this._parentID !== parentTransform._worldID){
      // concat the parent matrix with the objects transform.
      const pt = parentTransform.worldTransform;
      const wt = this.worldTransform;
      if(this.ignoreParentScaleAndRotation) {
        wt.a = lt.a;
        wt.b = lt.b;
        wt.c = lt.c;
        wt.d = lt.d;
        wt.tx = lt.tx + pt.tx;
        wt.ty = lt.ty + pt.ty;
      } else {
        wt.a = (lt.a * pt.a) + (lt.b * pt.c);
        wt.b = (lt.a * pt.b) + (lt.b * pt.d);
        wt.c = (lt.c * pt.a) + (lt.d * pt.c);
        wt.d = (lt.c * pt.b) + (lt.d * pt.d);
        wt.tx = (lt.tx * pt.a) + (lt.ty * pt.c) + pt.tx;
        wt.ty = (lt.tx * pt.b) + (lt.ty * pt.d) + pt.ty
      }

      if(this.truncateTranslation) {
        wt.tx = Math.floor(wt.tx);
        wt.ty = Math.floor(wt.ty)
      }
      this._parentID = parentTransform._worldID;
      // update the id of the transform..
      this._worldID++;
    }
  }
}

// Modifies 'child' so that it does not care about parent scaling and rotation,
// and/or truncates the translation. An example 'child' object for this function
// is an object on some zoomable stage, such as an icon, that should not resize
// when zooming, and/or remain pixel sharp while zooming.
export default function paralyzeTransformInheritance(child, ignoreParentScaleAndRotation, truncateTranslation) {
  var t = child.transform;
  if(!(t instanceof ParalyzedInheritanceTransform)) {
    t = new ParalyzedInheritanceTransform();
    t.setFromMatrix(child.transform.worldTransform);
    child.transform = t
  }
  t.ignoreParentScaleAndRotation = ignoreParentScaleAndRotation;
  t.truncateTranslation = truncateTranslation;
  return child
}
