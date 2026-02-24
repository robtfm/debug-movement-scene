import { AvatarMovement, engine, InputAction, inputSystem, Material, MaterialTransparencyMode, MeshCollider, MeshRenderer, Transform, TriggerArea, triggerAreaEventsSystem } from "@dcl/sdk/ecs";
import { Color4, Vector3 } from "@dcl/sdk/math";
import { GRAVITY } from "./constants";
import { tick, velocity } from ".";
import { orientation, targetOrientation } from "./horizontal";
import { grounded, setGrounded } from "./ground";

var waterTick = -1;

export function initPool() {
    const poolVisual = engine.addEntity();
    const pool = engine.addEntity();
    MeshRenderer.setBox(poolVisual);
    Material.setPbrMaterial(poolVisual, {
        albedoColor: Color4.create(0.0, 0.2, 1.0, 0.4),
        transparencyMode: MaterialTransparencyMode.MTM_ALPHA_BLEND,
    })
    Transform.create(poolVisual, { position: { x: 35, y: 5, z: 25 }, scale: { x: 20, y: 10, z: 20 } })

    TriggerArea.setBox(pool);
    Transform.create(pool, { position: { x: 35, y: 5 - 1.5 / 2, z: 25 }, scale: { x: 20, y: 10 - 1.5, z: 20 } })

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

    triggerAreaEventsSystem.onTriggerStay(pool, function (result) {
        if (result.trigger?.entity !== engine.PlayerEntity) return;
        waterTick = tick;
        setGrounded(true)
    })
    engine.addSystem(waterMovement, 100000 - 6);
}

function waterMovement(dt: number) {
    if (waterTick != tick) {
        return;
    }

    velocity.y += 12 * dt;

    if (inputSystem.isPressed(InputAction.IA_JUMP)) {
        velocity.y += 12 * dt;
    }
    if (inputSystem.isPressed(InputAction.IA_MODIFIER)) {
        velocity.y -= 12 * dt;
    }

    const dragFactor = Math.exp(-3 * dt);
    velocity.x *= dragFactor;
    velocity.y *= dragFactor;
    velocity.z *= dragFactor;

    if (velocity.y > 3) {
        velocity.y = 3;
    }

    AvatarMovement.createOrReplace(engine.PlayerEntity, {
        velocity,
        orientation: -orientation,
    })
}