declare module "resonance-audio" {
    export namespace ResonanceAudio {
        /** Options for constructing a new ResonanceAudio scene */
        export interface Options {
            /** Desired ambisonic Order */
            ambisonicOrder?: 1 | 3;
            /** The listener's initial position (in meters), where origin is the center of
             * the room */
            listenerPosition?: Float32Array;
            /** The listener's initial forward vector */
            listenerForward?: Float32Array;
            /** The listener's initial up vector */
            listenerUp?: Float32Array;
            /** Room dimensions (in meters) */
            dimensions?: Utils.RoomDimensions;
            /** Named acoustic materials per wall */
            materials?: Utils.RoomMaterials;
            /** (in meters/second) */
            speedOfSound?: number;
        }
    }

    /** Main class for managing sources, room and listener models */
    export class ResonanceAudio {
        /** Binaurally-rendered stereo (2-channel) output */
        output: AudioNode;
        /** Ambisonic (multichannel) input */
        ambisonicInput: AudioNode;
        /** Ambisonic (multichannel) output */
        ambisonicOutput: AudioNode;

        constructor(context: AudioContext, options?: ResonanceAudio.Options);

        /**
         * Create a new source for the scene.
         * @param options
         * Options for constructing a new Source.
         */
        createSource(options?: Source.Options): Source;

        /**
         * Set the scene's desired ambisonic order.
         * @param ambisonicOrder Desired ambisonic order.
         */
        setAmbisonicOrder(ambisonicOrder): void;

        /**
         * Set the room's dimensions and wall materials.
         * @param dimensions Room dimensions (in meters).
         * @param materials Named acoustic materials per wall.
         */
        setRoomProperties(
            dimensions: Utils.RoomDimensions,
            materials: Utils.RoomMaterials
        ): void;

        /**
         * Set the listener's position (in meters), where origin is the center of
         * the room.
         */
        setListenerPosition(x: number, y: number, z: number);

        /** Set the source's orientation using forward and up vectors. */
        setOrientation(
            forwardX: number,
            forwardY: number,
            forwardZ: number,
            upX: number,
            upY: number,
            upZ: number
        ): void;

        /**
         * Set the listener's position and orientation using a Three.js Matrix4 object.
         * @param matrix
         * The Three.js Matrix4 object representing the listener's world transform.
         */
        setListenerFromMatrix(matrix4: Float32Array): void;

        /**
         * Set the speed of sound.
         */
        setSpeedOfSound(speedOfSound: number): void;
    }

    export namespace Source {
        /** Options for constructing a new Source. */
        export interface Options {
            /** The source's initial position (in meters), where origin is the center of
             * the room */
            position?: Float32Array;
            /** The source's initial forward vector */
            forward?: Float32Array;
            /** The source's initial up vector */
            up?: Float32Array;
            /** Min. distance (in meters) */
            minDistance?: number;
            /** Max. distance (in meters) */
            maxDistance?: number;
            /** Rolloff model to use */
            rolloff?: string;
            /** Input gain (linear) */
            gain?: number;
            /** Directivity alpha */
            alpha?: number;
            /** Directivity sharpness */
            sharpness?: number;
            /** Source width (in degrees). Where 0 degrees is a point source and 360 degrees
             * is an omnidirectional source */
            sourceWidth?: number;
        }
    }

    /**
     * Source model to spatialize an audio buffer.
     */
    export class Source {
        constructor(scene: ResonanceAudio, options?: Source.Options);

        /** Mono (1-channel) input */
        input: AudioNode;

        /**
         * Set source's position (in meters), where origin is the center of
         * the room.
         */
        setPosition(x: number, y: number, z: number): void;

        /** Set source's rolloff. */
        setRolloff(rolloff: string): void;

        /** Set source's minimum distance (in meters). */
        setMinDistance(minDistance: number): void;

        /** Set source's maximum distance (in meters). */
        setMaxDistance(maxDistance: number): void;

        /** Set source's gain (linear). */
        setGain(gain: number): void;

        /** Set the source's orientation using forward and up vectors. */
        setOrientation(
            forwardX: number,
            forwardY: number,
            forwardZ: number,
            upX: number,
            upY: number,
            upZ: number
        ): void;

        /** Set source's position and orientation using a
         * Three.js modelViewMatrix object */
        setFromMatrix(matrix4: Float32Array): void;

        /** Set the source width (in degrees). Where 0 degrees is a point source and 360
         * degrees is an omnidirectional source */
        setSourceWidth(sourceWidth: number): void;

        /**
         * Set source's directivity pattern (defined by alpha), where 0 is an
         * omnidirectional pattern, 1 is a bidirectional pattern, 0.5 is a cardiod
         * pattern. The sharpness of the pattern is increased exponentially
         * @param alpha
         * Determines directivity pattern (0 to 1).
         * @param sharpness
         * Determines the sharpness of the directivity pattern (1 to Inf).
         */
        setDirectivityPattern(alpha: number, sharpness: number): void;
    }

    export namespace Room {
        export interface Options {
            /** The listener's initial position (in meters), where origin is the center of
             * the room */
            listenerPosition?: Float32Array;
            /** Room dimensions (in meters) */
            dimensions?: Utils.RoomDimensions;
            /** Named acoustic materials per wall */
            materials?: Utils.RoomMaterials;
            /** (in meters/second) */
            speedOfSound?: number;
        }
    }

    /**
     * Model that manages early and late reflections using acoustic
     * properties and listener position relative to a rectangular room.
     */
    export class Room {
        constructor(context: AudioContext, options?: Room.Options);

        /**
         * Set the room's dimensions and wall materials.
         * @param dimensions Room dimensions (in meters)
         * @param materials Named acoustic materials per wall
         */
        setProperties(
            dimensions: Utils.RoomDimensions,
            materials: Utils.RoomMaterials
        ): void;

        /**
         * Set the listener's position (in meters), where origin is the center of
         * the room.
         */
        setListenerPosition(x: number, y: number, z: number): void;

        /**
         * Compute distance outside room of provided position (in meters).
         * @return
         * Distance outside room (in meters). Returns 0 if inside room.
         */
        getDistanceOutsideRoom(x: number, y: number, z: number): number;
    }

    export namespace Listener {
        export interface Options {
            /** Desired ambisonic order */
            ambisonicOrder: number;
            /** Initial position (in meters), where origin is the center of
             * the room */
            position?: Float32Array;
            /** The listener's initial forward vector */
            forward?: Float32Array;
            /** The listener's initial up vector */
            up?: Float32Array;
        }
    }

    /** Listener model to spatialize sources in an environment */
    export class Listener {
        /** Position (in meters) */
        position: Float32Array;
        /** Ambisonic (multichannel) input */
        input: AudioNode;
        /** Binaurally-rendered stereo (2-channel) output */
        output: AudioNode;
        /** Ambisonic (multichannel) output */
        ambisonicOutput: AudioNode;

        /**
         * Set the listener's orientation using forward and up vectors.
         */
        setOrientation(
            forwardX: number,
            forwardY: number,
            forwardZ: number,
            upX: number,
            upY: number,
            upZ: number
        ): void;

        /** Set listener's position and orientation using a
         * Three.js modelViewMatrix object */
        setFromMatrix(matrix4: Float32Array): void;
    }

    export namespace Utils {
        /** Properties describing the geometry of a room. */
        export interface RoomDimensions {
            width: number;
            height: number;
            depth: number;
        }

        export type TRoomMaterial =
            | "transparent"
            | "acoustic-ceiling-tiles"
            | "brick-bare"
            | "brick-painted"
            | "concrete-block-coarse"
            | "concrete-block-painted"
            | "curtain-heavy"
            | "fiber-glass-insulation"
            | "glass-thin"
            | "glass-thick"
            | "grass"
            | "linoleum-on-concrete"
            | "marble"
            | "metal"
            | "parquet-on-concrete"
            | "plaster-rough"
            | "plaster-smooth"
            | "plywood-panel"
            | "polished-concrete-or-tile"
            | "sheet-rock"
            | "water-or-ice-surface"
            | "wood-ceiling"
            | "wood-panel"
            | "uniform";
        /** Properties describing the wall materials */
        export interface RoomMaterials {
            left: TRoomMaterial;
            right: TRoomMaterial;
            front: TRoomMaterial;
            back: TRoomMaterial;
            down: TRoomMaterial;
            up: TRoomMaterial;
        }
    }
}
