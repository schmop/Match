import vec2 from './vec2.js';
import Color from './Color.js';
import Utils from './Utils.js';
import Field from './Field.js';

export default class ExplicitAnimations {

  static swapBlocks(block1, block2) {
    return () => {
      let positionDifference = 0;
      [block1, block2].forEach(curBlock => {
        let otherBlock = curBlock === block1 ? block2 : block1;
        let shownPos = curBlock.pos.add(curBlock.posOffset);
        let movingDirection = otherBlock.pos.sub(shownPos).scale(0.2);
        positionDifference += movingDirection.length();
        curBlock.posOffset = curBlock.posOffset.add(movingDirection);
      });
      if (positionDifference < 0.1) {
        return true;
      }
      return false;
    };
  }

  static swapBlocksEnd(block1, block2, field) {
    return () => {
      block1.posOffset = new vec2(0,0);
      block2.posOffset = new vec2(0,0);
      let tmpPos = block1.pos;
      block1.pos = block2.pos;
      block2.pos = tmpPos;
      field.findAndRemoveMatches();
    };
  }

  static killBlocks(blocks) {
    let alpha = 0;
    let animationObj = {
      render: (ctx) => {
        blocks.forEach(block => {
          let diff = block.bottomRight.sub(block.topLeft);
          ctx.strokeStyle = (new Color(255, 255, 255, alpha/255)).toString();
          ctx.strokeRect(block.topLeft.x, block.topLeft.y, diff.x, diff.y);
        });
      }
    }
    window.game.addRenderable(animationObj, 10);
    return () => {
      alpha += 10;
      if (alpha > 255) {
        window.game.removeRenderable(animationObj);
        return true;
      }
      return false;
    };
  }

  static killBlocksEnd(blocks, grid, field) {
    return () => {
      let num = blocks.length;
      let center = new vec2(0,0);
      blocks.forEach(block => {
        /*
        field.animation.startAnimation(
          ExplicitAnimations.renderTextFadingOut('+ 1', block.center, 5)
        );*/
        center = center.add(block.center);
        grid.remove(block);
        block.remove();
      });
      center = center.scale(1 / num);
      field.animation.startAnimation(
        ExplicitAnimations.renderTextFadingOut('+' + num, center, 3)
      );
      field.waitForMovementStop = true;
    };
  }

  static renderTextFadingOut(text, pos, fadeSpeed) {
    let fadingPos = pos.clone();
    let randomWiggle = Utils.randInt(10,50);
    let fadeColor = new Color(0,0,0,1);
    let fadingText = {
      render: (ctx) => {
        ctx.fillStyle = fadeColor.toString();
        ctx.font = Field.BLOCK_SIZE + "px Monospace";
        ctx.textAlign = "center";
        ctx.fillText(text, fadingPos.x, fadingPos.y);
      }
    }
    window.game.addRenderable(fadingText);
    return () => {
      fadingPos = fadingPos.add(Math.cos(fadeColor.a * randomWiggle), -1);
      fadeColor.a -= fadeSpeed / 255;
      if (fadeColor.a <= 0) {
        window.game.removeRenderable(fadingText);
        return true;
      }
      return false;
    };
  }
}