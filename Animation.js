export default class Animation {
  constructor() {
    this.animations = [];

    this.game.addUpdateable(this);
  }

  get game() { return window.game; }
  get animationsActive() { return this.animations.length > 0; }

  startAnimation(callback, finishCallback) {
    if (typeof callback !== "function") {
      console.error("callback ", callback, "is not an animation callback function");
    }
    this.animations.push({
      callback: callback,
      finishCallback: finishCallback
    });

    return callback;
  }

  stopAnimation(callback) {
    this.animations = this.animations.filter(animation => animation === callback);
  }

  update() {
    let removeAfter = [];
    this.animations.forEach(animation => {
      // animation finished
      if (animation.callback() === true) {
        if (typeof animation.finishCallback === "function") {
          animation.finishCallback();
        }
        removeAfter.push(animation);
      }
    });
    this.animations = this.animations.filter(animation => removeAfter.find(remove => remove === animation) == null);
  }

}
