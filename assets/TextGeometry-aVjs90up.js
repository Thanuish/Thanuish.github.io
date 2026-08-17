import { E as f } from "./index-DUlStPr5.js";
class t extends f {
  constructor(i, e = {}) {
    const n = e.font;
    if (n === void 0) super();
    else {
      const d = n.generateShapes(i, e.size, e.direction);
      e.depth === void 0 && (e.depth = 50), e.bevelThickness === void 0 && (e.bevelThickness = 10), e.bevelSize === void 0 && (e.bevelSize = 8), e.bevelEnabled === void 0 && (e.bevelEnabled = false), super(d, e);
    }
    this.type = "TextGeometry";
  }
}
export {
  t as TextGeometry
};
