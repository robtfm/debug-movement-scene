import { AvatarMovement, AvatarMovementInfo, engine, InputAction, inputSystem, PointerEventType, Transform } from '@dcl/sdk/ecs'
import { Quaternion, Vector3 } from '@dcl/sdk/math';
import { getExplorerConfiguration } from '~system/EnvironmentApi';
import { initDebugObjects } from './debug';
import { initGroundRaycast, updateGroundAdjust } from './ground';
import { orientation, setOrientation, updateHorizontalVelocity } from './horizontal';
import { initStepCasts, updateVerticalVelocity } from './vertical';
import { initJetpackMode, moveJetpack } from './jetpack';
import { updateMovementAxis } from './input';
import { initPool } from './pool';
import { initLadder } from './ladder';

// export all the functions required to make the scene work
export * from '@dcl/sdk'

// setup
var positionAdjust = Vector3.Zero();
export function main() {
  getExplorerConfiguration({}).then((config) => {
    positionAdjust = {
      "bevy-explorer": Vector3.Zero(),
      "": Vector3.create(0, -0.08, 0), // probably explorer alpha...
    }[config.clientUri] ?? (console.log(`unknown client ${config.clientUri}`), Vector3.Zero());
    updateGroundAdjust(positionAdjust.y);
  })

  initGroundRaycast();
  initStepCasts();

  engine.addSystem(initFrame, 100000 + 1);
  engine.addSystem(applyMovement, 100000 - 3);

  initDebugObjects();

  engine.addSystem(changeMode);

  initJetpackMode();
  initPool();
  initLadder();
}

export var time = 0;
export var tick = 0;
export var playerPosition: Vector3 = Vector3.Zero();
export var prevPlayerPosition: Vector3 = Vector3.Zero();
export var playerRotation: Quaternion = Quaternion.Identity();

export var velocity = Vector3.Zero();
export var velocityNorm = Vector3.Zero();
export var velocityLength = 0;
export var prevRequestedVelocity = Vector3.Zero();
export var prevActualVelocity = Vector3.Zero();
export var prevExternalVelocity = Vector3.Zero();

export enum MoveMode {
  NORMAL,
  JETPACK,
};

export var mode: MoveMode = MoveMode.NORMAL;

export function printvec(v: Vector3) : string {
  return `(${v.x},${v.y},${v.z})`
}

function initFrame(dt: number) {
  tick += 1;
  time += dt;
  prevPlayerPosition = { ...playerPosition };
  const playerTransform = Transform.get(engine.PlayerEntity)
  Vector3.copyFrom(playerTransform.position, playerPosition);
  Vector3.addToRef(playerPosition, positionAdjust, playerPosition);
  playerRotation = playerTransform.rotation;

  const movementInfo = AvatarMovementInfo.getOrNull(engine.PlayerEntity);
  if (movementInfo !== null) {
    Vector3.copyFrom(movementInfo.requestedVelocity ?? Vector3.Zero(), prevRequestedVelocity);
    Vector3.copyFrom(movementInfo.actualVelocity ?? Vector3.Zero(), prevActualVelocity);
    Vector3.copyFrom(movementInfo.externalVelocity ?? Vector3.Zero(), prevExternalVelocity);
  }

  // avoid rounding errors
  if (Vector3.distance(velocity, prevActualVelocity) > 0.1) {
    velocity = prevActualVelocity;
  }
}

function writeMovement() {
  AvatarMovement.createOrReplace(engine.PlayerEntity, {
    velocity,
    orientation: -orientation,
    groundDirection: Vector3.Down(),
  })
}

function applyMovement(dt: number) {
  updateMovementAxis();

  if (mode === MoveMode.NORMAL) {
    updateVerticalVelocity(dt);
    updateHorizontalVelocity(dt);
  } else if (mode == MoveMode.JETPACK) {
    moveJetpack(dt);
  }

  if (Vector3.length(velocity) < 0.01 || Number.isNaN(Vector3.length(velocity))) {
    velocity = Vector3.Zero();
  }
  Vector3.normalizeToRef(velocity, velocityNorm);
  velocityLength = Vector3.length(velocity);

  if (Number.isNaN(orientation)) {
    setOrientation(0);
  }

  if (mode === MoveMode.JETPACK) {
    writeMovement();
  }
}

function changeMode() {
  if (inputSystem.isPressed(InputAction.IA_ACTION_3)) {
    mode = MoveMode.NORMAL;
  }
  if (inputSystem.isPressed(InputAction.IA_ACTION_4)) {
    mode = MoveMode.JETPACK;
  }
}