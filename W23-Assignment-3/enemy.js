import {defs, tiny} from './examples/common.js';
import {map_width, map_height} from './proc-gen.js';
const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture,
} = tiny;

const Enemy =
	class Enemy {
		constructor(scene, proc_gen, x, y) {
			const data_members = {
				follow_player: true,
				scene: scene,
				proc_gen: proc_gen,
				x: x,
				y: y,
				tick_initial_x: x,
				tick_initial_y: y,
				angle_of_view: Math.PI / 2,
				radius: 0.3,
				rotation_magnitude: 0,
				health: 1,
				speed: 0.05
			}
			Object.assign(this, data_members);
		}
		
		moveForward() {
			this.x += this.speed * Math.cos(this.angle_of_view);
			this.y += this.speed * Math.sin(this.angle_of_view);
		}
		
		face_at(x, y) { this.angle_of_view = Math.atan2(y - this.y,x - this.x); }
		
		performAction() {
			if(this.follow_player) {
				this.face_at(this.scene.player_x, this.scene.player_y);
				console.log(this.scene.player_x, this.scene.player_y, this.x, this.y);
				this.moveForward();
			}
		}
	}
	
export default Enemy