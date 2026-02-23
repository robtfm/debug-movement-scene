import { Color4, Quaternion, Vector3 } from "@dcl/sdk/math";
import { orientation, setOrientation } from "./horizontal";
import { AvatarAnchorPointType, AvatarAttach, engine, InputAction, inputSystem, Material, MaterialTransparencyMode, MeshRenderer, Transform, VisibilityComponent } from "@dcl/sdk/ecs";
import { mode, MoveMode, printvec, velocity } from ".";
import { rawMovementAxis } from "./input";
import { GRAVITY, VEC3_UP, VEC3_ZERO } from "./constants";
import { grounded } from "./ground";

var jetpackAngle = 0;
var VEC3_X = Vector3.create(1,0,0);
var VEC3_Z = Vector3.create(0,0,1);

var turnSpeed = 0;
var pitch = 0;

const TURN_ACCEL = 200;
const TURN_CAP = 150;

const PITCH_CAP = 45;
const PITCH_SPEED = 100;

const JETPACK_POWER = 15;

export function initJetpackMode() {
    engine.addSystem(toggleJetpack);
    engine.addSystem(updateJetpackMats);
    initJetpackMesh();
}

var isJetpack = false;
const left = engine.addEntity();
const right = engine.addEntity();
const leftFire = engine.addEntity();
const rightFire = engine.addEntity();

function toggleJetpack() {
    if (mode === MoveMode.JETPACK && !isJetpack) {
        isJetpack = true;
        VisibilityComponent.getMutable(left).visible = true;
        VisibilityComponent.getMutable(right).visible = true;
        turnSpeed = 0;
        pitch = 0;
    } else if (mode !== MoveMode.JETPACK && isJetpack) {
        isJetpack = false;
        VisibilityComponent.getMutable(left).visible = false;
        VisibilityComponent.getMutable(right).visible = false;
        VisibilityComponent.getMutable(leftFire).visible = false;
        VisibilityComponent.getMutable(rightFire).visible = false;
    }
}

function initJetpackMesh() {
    const mat = { 
        albedoColor: Color4.create(1.5, 1.5, 2),
        metallic: 1,
        roughness: 0.1
    };
    const fireMat = {
        albedoColor: Color4.create(1,0.3,0,0.75),
        emissiveColor: Color4.create(1,0.3,0,0.75),
        emissiveIntensity: 5,
        transparencyMode: MaterialTransparencyMode.MTM_ALPHA_BLEND
    };

    MeshRenderer.setCylinder(left);
    Material.setPbrMaterial(left, mat);
    Transform.createOrReplace(left, { parent: engine.PlayerEntity, position: { x: -0.1, y: 1.3, z: -0.2 }, scale: { x: 0.2, y: 0.4, z: 0.18 }})
    VisibilityComponent.createOrReplace(left, { visible: false })

    MeshRenderer.setCylinder(right);
    Material.setPbrMaterial(right, mat);
    Transform.createOrReplace(right, { parent: engine.PlayerEntity, position: { x: 0.1, y: 1.3, z: -0.2 }, scale: { x: 0.2, y: 0.4, z: 0.18 }})
    VisibilityComponent.createOrReplace(right, { visible: false })

    const leftFireParent = engine.addEntity();
    Transform.create(leftFireParent, {parent: left, position: { x: 0, y: -0.7 * 2.5, z: 0 }});
    MeshRenderer.setCylinder(leftFire, 0, 0.5);
    Material.setPbrMaterial(leftFire, fireMat);
    VisibilityComponent.createOrReplace(leftFire, { visible: false })
    const rightFireParent = engine.addEntity();
    Transform.create(rightFireParent, {parent: right, position: { x: 0, y: -0.7 * 2.5, z: 0 }});
    Transform.createOrReplace(leftFire, { parent: leftFireParent, scale: { x: 1, y: 2.5, z: 1 }})
    MeshRenderer.setCylinder(rightFire, 0, 0.5);
    Material.setPbrMaterial(rightFire, fireMat);
    Transform.createOrReplace(rightFire, { parent: rightFireParent, scale: { x: 1, y: 2.5, z: 1 }})
    VisibilityComponent.createOrReplace(rightFire, { visible: false })
}

var force = Vector3.Zero();
var upforce = Vector3.scale(VEC3_UP, JETPACK_POWER);
export function moveJetpack(dt: number) {
    const targetTurnSpeed = rawMovementAxis.x * TURN_CAP;
    turnSpeed = Math.min(TURN_CAP, Math.max(-TURN_CAP, 
        Math.min(turnSpeed + TURN_ACCEL * dt, Math.max(turnSpeed - TURN_ACCEL * dt, targetTurnSpeed))
    ));

    setOrientation(orientation + turnSpeed * dt);

    const pitchTarget = rawMovementAxis.z * PITCH_CAP;
    pitch = Math.min(PITCH_CAP, Math.max(-PITCH_CAP, Math.min(pitch + dt * PITCH_SPEED, Math.max(pitch - dt * PITCH_SPEED, pitchTarget))))
    Transform.getMutable(left).rotation = Quaternion.fromAngleAxis(pitch, VEC3_X);
    Transform.getMutable(right).rotation = Quaternion.fromAngleAxis(pitch, VEC3_X);

    if (inputSystem.isPressed(InputAction.IA_JUMP)) {
        Vector3.rotateToRef(upforce, Quaternion.fromEulerDegrees(pitch, orientation, 0), force);
        VisibilityComponent.getMutable(leftFire).visible = true;
        VisibilityComponent.getMutable(rightFire).visible = true;
    } else if (inputSystem.isPressed(InputAction.IA_MODIFIER)) {
        Vector3.rotateToRef(upforce, Quaternion.fromEulerDegrees(pitch, orientation, 0), force);
        Vector3.scaleToRef(force, 0.75, force);
        VisibilityComponent.getMutable(leftFire).visible = true;
        VisibilityComponent.getMutable(rightFire).visible = true;
    } else {
        Vector3.copyFrom(VEC3_ZERO, force);
        VisibilityComponent.getMutable(leftFire).visible = false;
        VisibilityComponent.getMutable(rightFire).visible = false;
    }
    Vector3.addToRef(force, GRAVITY, force);
    Vector3.scaleToRef(force, dt, force);

    if (grounded) {
        velocity.x = 0;
        velocity.y = Math.max(velocity.y, 0);
        velocity.z = 0;
    }

    Vector3.scaleToRef(velocity, Math.exp(-0.1 * dt), velocity);
    Vector3.addToRef(velocity, force, velocity);
}

function updateJetpackMats() {
    const color = Color4.create(0.5 + Math.random() * 2.5, 0.25 + Math.random() * 0.5, Math.random() * 0.5, 0.75);
    var size = 1.5 + Math.random();

    if (inputSystem.isPressed(InputAction.IA_MODIFIER) && !inputSystem.isPressed(InputAction.IA_JUMP)) {
        const r = color.r;
        color.r = color.b;
        color.b = r;
        size /= 2;
    }

    for (const fire of [leftFire, rightFire]) {
        let t = Transform.getMutable(fire);
        t.scale.y = size;
        t.position.y = 1.25-size/2;

        let m = Material.getMutable(fire);
        if (m.material?.$case === "pbr") {
            m.material.pbr.albedoColor = color;
            m.material.pbr.emissiveColor = color;
        }
    }
}