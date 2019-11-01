import Utils from './Utils.js';

export default class Color {
  constructor(r,g,b,a) {
    if (r instanceof Color) {
      this.r = r.r;
      this.g = r.g;
      this.b = r.b;
      this.a = r.a;
    } else {
      this.r = r || 0;
      this.g = g || 0;
      this.b = b || 0;
      this.a = a == null ? 1 : a;
    }
  }

  static random(brightness) {
    if (brightness == null) {
      brightness = 255;
    }
    return new Color(
      Utils.rand(0, brightness),
      Utils.rand(0, brightness),
      Utils.rand(0, brightness)
    );
  }

  static getUniqueColor(index, num, brightness) {
    if (brightness == null) {
      brightness = 255;
    }
    return Color.fromHsv(index / num, 1, (brightness - 80 * (index % 2)) / 255);
  }

  static fromHsv(h, s, v) {
    let r, g, b;

    let i = Math.floor(h * 6);
    let f = h * 6 - i;
    let p = v * (1 - s);
    let q = v * (1 - f * s);
    let t = v * (1 - (1 - f) * s);

    switch (i % 6) {
      case 0: r = v, g = t, b = p; break;
      case 1: r = q, g = v, b = p; break;
      case 2: r = p, g = v, b = t; break;
      case 3: r = p, g = q, b = v; break;
      case 4: r = t, g = p, b = v; break;
      case 5: r = v, g = p, b = q; break;
    }

    return new Color(r * 255, g * 255, b * 255);
  }

  hsv() {
    this.r /= 255, this.g /= 255, this.b /= 255;

    let max = Math.max(this.r, this.g, this.b), min = Math.min(this.r, this.g, this.b);
    let h, s, v = max;
    let d = max - min;
    s = max == 0 ? 0 : d / max;

    if (max == min) {
      h = 0; // achromatic
    } else {
      switch (max) {
        case this.r: h = (this.g - this.b) / d + (this.g < this.b ? 6 : 0); break;
        case this.g: h = (this.b - this.r) / d + 2; break;
        case this.b: h = (this.r - this.g) / d + 4; break;
      }

      h /= 6;
    }
    return [ h, s, v ];
  }

  maximizeBrightness() {
    const len = Math.sqrt(this.r**2 + this.g**2 + this.b**2);
    const fac = 255 / len;
    return new Color(this.r * fac, this.g * fac, this.b * fac, this.a);
  }

  toString() {
    return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
  }
}
