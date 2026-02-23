import { AvatarAnchorPointType, AvatarAttach, engine, Entity, Material, MeshCollider, MeshRenderer, Transform } from '@dcl/sdk/ecs'
import { Color4, Quaternion, Vector3 } from '@dcl/sdk/math';
import { playerPosition, prevPlayerPosition, time, velocity } from '.';
import { grounded, prevGrounded } from './ground';

var jsMark: Entity;
var jeMark: Entity;
export function initDebugObjects() {
    const floor = engine.addEntity();
    MeshRenderer.setBox(floor);
    Material.setPbrMaterial(floor, { albedoColor: Color4.create(0.1, 0.6, 0.5, 1)} )
    Transform.create(floor, { position: {x: 0, y: -0.05, z: 0}, scale: {x: 1000, y: 0.1, z: 1000}});

    jsMark = engine.addEntity()
    MeshRenderer.setSphere(jsMark);
    Material.setBasicMaterial(jsMark, { diffuseColor: Color4.Purple() });
    Transform.create(jsMark, { scale: Vector3.create(0.5, 0.5, 0.5) });
    jeMark = engine.addEntity()
    MeshRenderer.setSphere(jeMark);
    Material.setBasicMaterial(jeMark, { diffuseColor: Color4.Magenta() });
    Transform.create(jeMark, { scale: Vector3.create(0.5, 0.5, 0.5) });

    // run after raycasts
    engine.addSystem(recordSpeed, 100000 - 1);

    // jump height and step tests
    for (var i = 0; i < 49; i++) {
        let cube = engine.addEntity();
        Transform.create(cube, { position: { x: -15.5 + i, y: -0.4 + i / 20, z: 6 } });
        MeshRenderer.setBox(cube);
        MeshCollider.setBox(cube)
        var color = Color4.create((i % 10) / 10, 0, 1 - (i % 10) / 10);
        if (i == 28) {
            color = Color4.White();
        }
        if (i == 45) {
            color = Color4.White();
        }
        if (i == 6) {
            color = Color4.Yellow();
        }
        Material.setPbrMaterial(cube, { albedoColor: color });
    }

    // jump distance tests
    for (var i = 0; i < 8; i++) {
        let cube = engine.addEntity();
        Transform.create(cube, { position: { x: -5, y: 0, z: -10 - i * 5 }, scale: { x: 10, y: 1, z: 2 } });
        MeshRenderer.setBox(cube);
        MeshCollider.setBox(cube)
        var color = Color4.create((i % 10) / 10, 0, 1 - (i % 10) / 10);
        Material.setPbrMaterial(cube, { albedoColor: color });

        let cube2 = engine.addEntity();
        Transform.create(cube2, { position: { x: 7 + i, y: 0, z: -10 - i * 5 }, scale: { x: 1, y: 1, z: 2 } });
        MeshRenderer.setBox(cube2);
        MeshCollider.setBox(cube2)
        var color = Color4.create((i % 10) / 10, 0, 1 - (i % 10) / 10);
        Material.setPbrMaterial(cube2, { albedoColor: color });
    }

    const sphere = engine.addEntity();
    Transform.create(sphere, { position: { x: 0, z: 0, y: 5.5 }, scale: Vector3.scale(Vector3.One(), 10) });
    MeshRenderer.setSphere(sphere);
    MeshCollider.setSphere(sphere);
    Material.setPbrMaterial(sphere, { albedoColor: Color4.Blue() });
    engine.addSystem((dt) => {
        let h = 5.5 + 2.5 * Math.sin(time);
        Transform.createOrReplace(sphere, { position: { x: 0, z: 0, y: h }, scale: Vector3.scale(Vector3.One(), 10) });
    })

    const lift = engine.addEntity();
    MeshRenderer.setBox(lift)
    MeshCollider.setBox(lift)
    Transform.create(lift, { position: { x: 8, y: -0.4, z: 8 } })
    Material.setBasicMaterial(lift, { diffuseColor: Color4.Green() });
    engine.addSystem((dt: number) => {
        let liftPos = Transform.getMutable(lift).position;
        if (Vector3.length(Vector3.subtract(playerPosition, liftPos)) < 1.0) {
            liftPos.y += dt * 5;
        } else {
            liftPos.y = -0.4;
        }
    })

    // check collider width
    const widthWallLeft = engine.addEntity();
    MeshRenderer.setBox(widthWallLeft);
    MeshCollider.setBox(widthWallLeft);
    Transform.create(widthWallLeft, { position: { x: 5, y: 1, z: 25 }, scale: { x: 0.1, y: 1, z: 32 }, rotation: Quaternion.fromAngleAxis(5, Vector3.Up()) });
    const widthWallRight = engine.addEntity();
    MeshRenderer.setBox(widthWallRight);
    MeshCollider.setBox(widthWallRight);
    Transform.create(widthWallRight, { position: { x: 8, y: 1, z: 25 }, scale: { x: 0.1, y: 1, z: 32 }, rotation: Quaternion.fromAngleAxis(-5, Vector3.Up()) });

    // check collider height
    const ceiling = engine.addEntity();
    MeshRenderer.setBox(ceiling);
    MeshCollider.setBox(ceiling);
    Transform.create(ceiling, { position: { x: 16, y: 2, z: 25 }, scale: { x: 1, y: 0.1, z: 32 }, rotation: Quaternion.fromAngleAxis(-5, Vector3.Right()) });

    // check step height
    for (var i = 0; i < 25; i++) {
        let cube = engine.addEntity();
        Transform.create(cube, { position: { x: 25, y: -.3 + i / 100, z: -10 - i }, scale: { x: 1, y: 1, z: 1 } });
        MeshRenderer.setBox(cube);
        MeshCollider.setBox(cube)
        var color = Color4.create((i % 10) / 10, 0, 1 - (i % 10) / 10);
        Material.setPbrMaterial(cube, { albedoColor: color });

        let cube2 = engine.addEntity();
        Transform.create(cube2, { position: { x: 25 + i / 20, y: 1, z: -10 - i }, scale: { x: 1, y: 2, z: 1 } });
        MeshRenderer.setBox(cube2);
        MeshCollider.setBox(cube2)
        var color = Color4.create((i % 10) / 10, 0, 1 - (i % 10) / 10);
        Material.setPbrMaterial(cube2, { albedoColor: color });
    }

    // check slopes
    for (var i = 0; i < 30; i++) {
        let cube = engine.addEntity();
        Transform.create(cube, { position: { x: -20, y: 0, z: -10 - i }, scale: { x: 10, y: 0.1, z: 1 }, rotation: Quaternion.fromAngleAxis(i * 3, Vector3.Forward()) });
        MeshRenderer.setBox(cube);
        MeshCollider.setBox(cube)
        var color = Color4.create((i % 10) / 10, 0, 1 - (i % 10) / 10);
        Material.setPbrMaterial(cube, { albedoColor: color });
    }

    // check snap over a sharp edge
    for (var i = 0; i < 7; i++) {
        let cliff = engine.addEntity();
        let angle = 10 + 5 * i;
        let angleRad = angle / 180 * Math.PI;
        let distance = 7.5 * (Math.cos(angleRad) - Math.sin(angleRad));

        Transform.create(cliff, { position: { x: -15 - distance, y: -6 + i * .5, z: 15 + 5 * i }, scale: { x: 15, y: 15, z: 5 }, rotation: Quaternion.fromAngleAxis(angle, Vector3.Forward()) });
        MeshRenderer.setBox(cliff);
        MeshCollider.setBox(cliff)
        var color = Color4.create((i % 10) / 10, 0, 1 - (i % 10) / 10);
        Material.setPbrMaterial(cliff, { albedoColor: color });

        let cliff2 = engine.addEntity();
        Transform.create(cliff2, { position: { x: -15 + distance, y: -6 + i * .5, z: 15 + 5 * i }, scale: { x: 15, y: 15, z: 5 }, rotation: Quaternion.fromAngleAxis(90 - angle, Vector3.Forward()) });
        MeshRenderer.setBox(cliff2);
        MeshCollider.setBox(cliff2)
        Material.setPbrMaterial(cliff2, { albedoColor: color });
    }
}

var maxSpeed: number = 0;
var maxHeight: number = -99;
var prevPositions: Vector3[] = [];
var prevTimes: number[] = [];
var lastJumpTime = 0;
var lastJumpPos = Vector3.Zero();
var jumpmarker = false;
function recordSpeed(dt: number) {
    prevPositions.push({ ...playerPosition });
    prevTimes.push(time);

    if (prevPositions.length < 20) {
        return;
    }

    const prevPosition = prevPositions.splice(0, 1)[0];
    const prevTime = prevTimes.splice(0, 1)[0];

    const move = Vector3.subtract(prevPosition, playerPosition);
    const distance = Vector3.length(move);
    const speed = distance / (time - prevTime);

    if (speed > maxSpeed) {
        maxSpeed = Math.max(maxSpeed, speed);
        console.log(`max speed: ${maxSpeed}`);
    }

    if (playerPosition.y > maxHeight) {
        maxHeight = playerPosition.y;
        console.log(`max height: ${maxHeight} after ${time - lastJumpTime} seconds (${Transform.get(engine.PlayerEntity).position.y})`);
    }

    if (grounded) {
        jumpmarker = false
    }
    if (playerPosition.y > prevPlayerPosition.y + 0.0001 && !jumpmarker) {
        lastJumpPos = prevPlayerPosition;
        lastJumpTime = time - dt;
        Vector3.copyFrom(lastJumpPos, Transform.getMutable(jsMark).position)
        jumpmarker = true;
    }

    if (grounded && !prevGrounded) {
        const distance = Vector3.distance(Vector3.create(playerPosition.x, 0, playerPosition.z), Vector3.create(lastJumpPos.x, 0, lastJumpPos.z));
        const jtime = time - lastJumpTime;
        console.log(`jump distance: ${distance} over ${jtime} secs`);
        Vector3.copyFrom(playerPosition, Transform.getMutable(jeMark).position)
    }
}