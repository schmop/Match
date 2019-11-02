import vec2 from './vec2.js';
import Color from './Color.js';
import Utils from './Utils.js';
import Field from './Field.js';
import MatchX from './GameTypes/MatchX.js';

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

  static swapBlocksEnd(block1, block2, field, checkForMatch) {
    return () => {
      block1.posOffset = new vec2(0,0);
      block2.posOffset = new vec2(0,0);
      let tmpTeam = block1.team;
      block1.updateTeam(block2.team);
      block2.updateTeam(tmpTeam);
      if (checkForMatch) {
        if (!field.findAndRemoveMatches()) {
          field.blockingAnimation.startAnimation(
            ExplicitAnimations.swapBlocks(block1, block2),
            ExplicitAnimations.swapBlocksEnd(block1, block2, field, false)
          );
        }
      }
    };
  }

  static killBlocks(blocks) {
    let alpha = 0;
    let animationObj = {
      render: (ctx) => {
        ctx.strokeStyle = (new Color(0, 0, 0, alpha/255)).toString();
        ctx.lineWidth = Field.BLOCK_SIZE / 10;
        blocks.forEach(block => {
          let diff = block.bottomRight.sub(block.topLeft);
          ctx.strokeRect(block.topLeft.x, block.topLeft.y, diff.x, diff.y);
        });
        ctx.strokeStyle = (new Color(255, 255, 255, alpha/255)).toString();
        ctx.lineWidth = Field.BLOCK_SIZE / 20;
        blocks.forEach(block => {
          let diff = block.bottomRight.sub(block.topLeft);
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

  static killBlocksEndEndless(blocks, grid, field) {
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

  static killBlocksEndMatchX(blocks, grid, field) {
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
        ExplicitAnimations.renderTextFadingOut('+' + MatchX.getScore(num), center, 3)
      );
      field.waitForMovementStop = true;
    };
  }

  static renderTextFadingOut(text, pos, fadeSpeed) {
    let fadingPos = pos.clone();
    let randomWiggle = Utils.randInt(10,50);
    let strokeColor = new Color(0, 0, 0);
    let fillColor = new Color(255, 255, 255);
    let alpha = 1;
    let fadingText = {
      render: (ctx) => {
        ctx.fillStyle = fillColor.toString();
        ctx.strokeStyle = strokeColor.toString();
        ctx.strokeStyle
        ctx.font = Field.BLOCK_SIZE + "px Monospace";
        ctx.textAlign = "center";
        ctx.lineWidth = 2;
        ctx.fillText(text, fadingPos.x, fadingPos.y);
        ctx.strokeText(text, fadingPos.x, fadingPos.y);
      }
    }
    window.game.addRenderable(fadingText, 15);
    return () => {
      alpha -= fadeSpeed / 255;
      strokeColor.a = fillColor.a = alpha;
      fadingPos = fadingPos.add(Math.cos(alpha * randomWiggle), -1);
      if (alpha <= 0) {
        window.game.removeRenderable(fadingText);
        return true;
      }
      return false;
    };
  }

  static renderTextBox(text, time) {
    let foreGround = new Color(0,0,0);
    let backGround = new Color(255,255,255);
    let padding = 0.2;
    let stroke = 5;
    let fadeOutFor = 1500;
    let rectWidth, rectHeight, rectPos, center, textMeasure = null;
    let startTime = Date.now();
    let textBox = {
      render: (ctx) => {
        if (textMeasure === null) {
          textMeasure = ctx.measureText(text);
          center = new vec2(window.game.width, window.game.height).scale(0.5);
          rectWidth = textMeasure.width * (1 + padding / 2);
          rectHeight = Field.BLOCK_SIZE * 1.5 * (1 + padding / 2);
          rectPos = center.sub(rectWidth / 2, rectHeight / 2);
        }
        ctx.fillStyle = backGround.toString();
        ctx.lineWidth = stroke;
        ctx.strokeStyle = foreGround.toString();
        ctx.fillRect(rectPos.x, rectPos.y, rectWidth, rectHeight);
        ctx.strokeRect(rectPos.x, rectPos.y, rectWidth, rectHeight);
        ctx.fillStyle = ctx.strokeStyle;
        ctx.font = Field.BLOCK_SIZE + "px Monospace";
        ctx.textAlign = "center";
        ctx.fillText(text, center.x, center.y + Field.BLOCK_SIZE / 4);
      }
    }
    window.game.addRenderable(textBox, 20);
    return () => {
      let timeActive = Date.now() - startTime;
      if (time - timeActive < fadeOutFor) {
        backGround.a = foreGround.a = (time - timeActive) / fadeOutFor;
      }
      if (time - timeActive < 0) {
        window.game.removeRenderable(textBox);
        return true;
      }
      return false;
    };
  }
}
