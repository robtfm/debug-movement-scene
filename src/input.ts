import { Vector3 } from "@dcl/sdk/math";
import { VEC3_HORIZONTAL_MASK, VEC3_ZERO } from "./constants";
import { engine, InputAction, inputSystem, Transform } from "@dcl/sdk/ecs";

export var rawMovementAxis = Vector3.Zero();
export var movementAxis = Vector3.Zero();

Vector3.copyFrom(VEC3_ZERO, movementAxis);

export function updateMovementAxis() {
  Vector3.fromArrayToRef([0,0,0], 0, rawMovementAxis);
  if (inputSystem.isPressed(InputAction.IA_LEFT)) {
    Vector3.addToRef(rawMovementAxis, Vector3.Left(), rawMovementAxis);
  }
  if (inputSystem.isPressed(InputAction.IA_RIGHT)) {
    Vector3.addToRef(rawMovementAxis, Vector3.Right(), rawMovementAxis);
  }
  if (inputSystem.isPressed(InputAction.IA_FORWARD)) {
    Vector3.addToRef(rawMovementAxis, Vector3.Forward(), rawMovementAxis);
  }
  if (inputSystem.isPressed(InputAction.IA_BACKWARD)) {
    Vector3.addToRef(rawMovementAxis, Vector3.Backward(), rawMovementAxis);
  }

  const camera = Transform.get(engine.CameraEntity);
  Vector3.rotateToRef(rawMovementAxis, camera.rotation, movementAxis);
  Vector3.multiplyToRef(movementAxis, VEC3_HORIZONTAL_MASK, movementAxis);
  Vector3.normalizeToRef(movementAxis, movementAxis);
}