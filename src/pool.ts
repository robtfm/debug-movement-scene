import { AvatarMovement, engine, InputAction, inputSystem, Material, MaterialTransparencyMode, MeshCollider, MeshRenderer, Transform, TriggerArea, triggerAreaEventsSystem } from "@dcl/sdk/ecs";
import { Color4, Vector3 } from "@dcl/sdk/math";
import { GRAVITY } from "./constants";
import { tick, time, velocity, velocityLength } from ".";
import { orientation, targetOrientation } from "./horizontal";
import { grounded, setGrounded } from "./ground";

// Keep the swim animation playing briefly after leaving the trigger so that
// buoyancy-driven pop-outs at the surface don't reset the clip to frame 0
// each time we re-enter. Physics still gate strictly on being inside the
// trigger — applying buoyancy above water would amplify the oscillation.
const SWIM_GRACE_SECONDS = 0.25;

var waterTick = -1;
var lastWaterTime = -Infinity;

export function initPool() {
    const poolVisual = engine.addEntity();
    const pool = engine.addEntity();
    MeshRenderer.setBox(poolVisual);
    Material.setPbrMaterial(poolVisual, {
        albedoColor: Color4.create(0.0, 0.2, 1.0, 0.4),
        transparencyMode: MaterialTransparencyMode.MTM_ALPHA_BLEND,
    })
    Transform.create(poolVisual, { position: { x: 35, y: 4.55, z: 25 }, scale: { x: 20, y: 9.1, z: 20 } })

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
        lastWaterTime = time;
        setGrounded(true)
    })
    engine.addSystem(waterMovement, 100000 - 6);
}

function waterMovement(dt: number) {
    const inWater = waterTick == tick;
    const animActive = time - lastWaterTime < SWIM_GRACE_SECONDS;

    if (!inWater && !animActive) {
        return;
    }

    if (inWater) {
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
    }

    AvatarMovement.createOrReplace(engine.PlayerEntity, {
        velocity,
        orientation: -orientation,
        animation: {
            src: 'assets/animations/swim.glb',
            speed: Math.max(0.3, velocityLength / 2),
            loop: true,
            idle: false,
            transitionSeconds: 0.4,
            sounds: [],
        },
    })
}