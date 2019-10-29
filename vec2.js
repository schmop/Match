export default class vec2 {
  constructor(x, y) {
    this.x = x || 0;
    this.y = y || 0;
  }

  clone() {
    return new vec2(this.x, this.y);
  }

  add(x, y) {
    if (!(x instanceof vec2)) {
      x = new vec2(x,y);
    }
    return new vec2(this.x + x.x, this.y + x.y);
  }

  sub(x, y) {
    if (!(x instanceof vec2)) {
      x = new vec2(x,y);
    }
    return new vec2(this.x - x.x, this.y - x.y);
  }

  normalize() {
    return this.scale(1 / this.length());
  }

  scale(factor) {
    return new vec2(this.x * factor, this.y * factor);
  }

  length() {
		return Math.sqrt(this.dot(this));
	}

  dot(x,y) {
    if (!(x instanceof vec2)) {
      x = new vec2(x,y);
    }
    return this.x*x.x + this.y*x.y;
  }

	distance(x, y) {
    if (!(x instanceof vec2)) {
      x = new vec2(x,y);
    }
		return this.sub(x).length();
	}

  closestPointOnLine(a, b) {
    let ap = this.sub(a);
    let ab = b.sub(a);
    let magnitudeAB = ab.dot(ab);
    let abapProduct = ap.dot(ab);
    let dist = abapProduct / magnitudeAB;

    if (dist < 0) {
      return a;
    } else if (dist > 1) {
      return b;
    }
    return a.add(ab.scale(dist));
  }

  toString() {
    return '(' + this.x + ', ' + this.y + ')';
  }
}
