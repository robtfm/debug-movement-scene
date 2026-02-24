import { AvatarMovement, engine, InputAction, inputSystem, Material, MaterialTransparencyMode, MeshCollider, MeshRenderer, Transform, TriggerArea, triggerAreaEventsSystem } from "@dcl/sdk/ecs";
import { Color4, Vector3 } from "@dcl/sdk/math";
import { printvec, tick, velocity } from ".";
import { orientation, setOrientation } from "./horizontal";
import { grounded, setGrounded } from "./ground";
import { VEC3_ZERO } from "./constants";

var ladderActive = false;

export function initLadder() {
    function makewall(position: Vector3, scale: Vector3) {
        const wall = engine.addEntity();
        MeshRenderer.setBox(wall);
        MeshCollider.setBox(wall);
        Material.setPbrMaterial(wall, { albedoColor: Color4.Yellow() })
        Transform.create(wall, { position, scale })
    }

    makewall({ x: 25, y: 5, z: 25 }, { x: 0.1, y: 10.5, z: 20 });
    makewall({ x: 45, y: 5, z: 25 }, { x: 0.1, y: 10.5, z: 20 });
    makewall({ x: 35, y: 5, z: 15 }, { x: 20, y: 10.5, z: 0.1 });
    makewall({ x: 35, y: 5, z: 35 }, { x: 20, y: 10.5, z: 0.1 });

    const ladder = engine.addEntity();
    TriggerArea.setBox(ladder);
    Transform.create(ladder, { position: { x: 25, y: 5, z: 25 }, scale: { x: 0.5, y: 10, z: 0.1 } })

    for (var i = 1; i < 10; i+= 0.5) {
        const rung = engine.addEntity()
        MeshRenderer.setBox(rung);
        Material.setPbrMaterial(rung, { albedoColor: Color4.create( 1, 0.5, 0, 1)})
        Transform.create(rung, { position: { x: 25, y: i, z: 25 }, scale: {x: 0.35, y: 0.1, z: 1 } })
    }

    triggerAreaEventsSystem.onTriggerEnter(ladder, function (result) {
        if (result.trigger?.entity !== engine.PlayerEntity) return;
        ladderActive = true;
    })
    triggerAreaEventsSystem.onTriggerExit(ladder, function (result) {
        if (result.trigger?.entity !== engine.PlayerEntity) return;
        ladderActive = false;
    })
    engine.addSystem(ladderMovement, 100000 - 5); // before water so you don't have to go to the bottom
}

function ladderMovement(dt: number) {
    if (!ladderActive || inputSystem.isPressed(InputAction.IA_JUMP)) {
        return;
    }

    if (Transform.get(engine.PlayerEntity).position.x > 25) {
        setOrientation(270)
    } else {
        setOrientation(90);
    }

    if (inputSystem.isPressed(InputAction.IA_FORWARD)) {
        Vector3.copyFromFloats(0, 3, 0, velocity);
    } else if (inputSystem.isPressed(InputAction.IA_BACKWARD)) {
        if (grounded) {
            return;
        }

        Vector3.copyFromFloats(0, -3, 0, velocity);
    } else {
        Vector3.copyFrom(VEC3_ZERO, velocity);
    }

    AvatarMovement.createOrReplace(engine.PlayerEntity, {
        velocity: {...velocity},
        orientation: -orientation,
    })
}