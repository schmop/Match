import ExplicitAnimations from '../ExplicitAnimations.js';
import Utils from '../Utils.js';

export default class Endless {
  static dragEnd(field, block) {
    if (field.draggingToBlock.team === field.draggingStart.team) {
      return;
    }
    // swap positions of blocks
    field.blockingAnimation.startAnimation(
      ExplicitAnimations.swapBlocks(block, field.draggingStart),
      ExplicitAnimations.swapBlocksEnd(block, field.draggingStart, field)
    );
  }

  static mouseStartCallback(field) {
    return (event) => {
      field.draggingStart = null;
      if (!field.blockingAnimation.animationsActive && !field.waitForMovementStop) {
        field.blocks.forEach(block => {
          if (block.hovered) {
            field.draggingStart = block;
          }
        });
      }
    }
  }

  static mouseEndCallback(field) {
    return (event) => {
      if (!field.draggingToBlockPos) {
        field.draggingStart = null;
        return;
      }
      for (let block of field.blocks) {
        if (Utils.rectContains(block.topLeft, block.bottomRight, field.draggingToBlockPos)) {
          Endless.dragEnd(field, block);
          break;
        }
      }
      field.draggingStart = null;
    };
  }

  static movementStop(field) {
    if (!field.blockingAnimation.animationsActive) {
      field.findAndRemoveMatches();
    }
  }
}
