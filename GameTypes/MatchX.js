import vec2 from '../vec2.js';
import Field from '../Field.js';
import ExplicitAnimations from '../ExplicitAnimations.js';

export default class MatchX {
  static mouseStartCallback(field) {
    return (event) => {
      if (!field.blockingAnimation.animationsActive && !field.waitForMovementStop) {
        MatchX.matchAtPosition(
          field,
          new vec2(
            Math.floor(field.game.mouse.pos.x / Field.BLOCK_SIZE),
            Math.floor(field.game.mouse.pos.y / Field.BLOCK_SIZE),
          )
        );
      }
    };
  }

  static mouseEndCallback(field) {
    return (event) => {
      // noop
    };
  }

  static matchAtPosition(field, pos) {
    field.createGrid();
    let aboutToRemove = [];
    if (field.grid.get(pos) == null) {
      return;
    }
    if (field.BDFCount(field.grid, pos, Field.MATCH_NUM, true, aboutToRemove)) {
      field.game.addScore(MatchX.getScore(aboutToRemove.length));
      field.blockingAnimation.startAnimation(
        ExplicitAnimations.killBlocks(aboutToRemove),
        ExplicitAnimations.killBlocksEndMatchX(aboutToRemove, field.grid, field)
      );
    }
  }

  static movementStop(field) {
    if (!field.blockingAnimation.animationsActive) {
      MatchX.winCheck(field);
    }
  }

  static winCheck(field) {
    field.createGrid();
    if (!field.findMatch(field.grid, false)) {
      field.blockingAnimation.startAnimation(
        ExplicitAnimations.renderTextBox("Game over! Score: " + field.game.score, 5000),
        () => {
          field.game.init();
        }
      );
    }
  }

  static getScore(numBlocks) {
    return (1 + numBlocks - Field.MATCH_NUM) ** 2;
  }

}
