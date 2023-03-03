import {defs, tiny} from './examples/common.js';
import {map_width, map_height} from './proc-gen.js';
const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture,
} = tiny;

const Enemy =
	class Enemy {
		constructor(scene, proc_gen, x, y) {
			const data_members = {
				follow_player: false,
				scene: scene,
				proc_gen: proc_gen,
				x: x,
				y: y,
				tick_initial_x: x,
				tick_initial_y: y,
				tile_i: Math.floor((x + 1) / 2),
				tile_j: Math.floor((y + 1) / 2),
				angle_of_view: Math.PI / 2,
				radius: 0.3,
				rotation_magnitude: 0,
				health: 1,
				speed: 0.05,
				current_remember_timeout: 10,
				max_remeber_timeout: 10,
			}
			Object.assign(this, data_members);
		}
		
		moveForward() {
			this.x += this.speed * Math.cos(this.angle_of_view);
			this.y += this.speed * Math.sin(this.angle_of_view);
		}
		
		face_at(x, y) { this.angle_of_view = Math.atan2(y - this.y,x - this.x); }

		current_tile() {
			let tile_i = Math.floor((this.x + 1) / 2);
			let tile_j = Math.floor((this.y + 1) / 2);
			if (tile_i == this.tile_i && tile_j == this.tile_j) {
				return null;
			}
			return [tile_i, tile_j];
		}
		
		performAction(player_x, player_y) {
			this.tick_initial_x = this.x;
			this.tick_initial_y = this.y;

			this.seePlayer(player_x, player_y); //player_x, player_y

			if(this.follow_player) {
				this.face_at(player_x, player_y); //player_x, player_y
				this.moveForward();
			}
		}


		canCurrentlySeePlayer(player_x, player_y) {

			let sight_vector = [player_x - this.x, player_y - this.y];
			let magnitude = Math.sqrt(sight_vector[0]**2 + sight_vector[1]**2);
			sight_vector = [sight_vector[0]/magnitude, sight_vector[1]/magnitude];
			let interval = 0.1;
			sight_vector = [sight_vector[0]*interval, sight_vector[1]*interval];
			
			let current_point = [this.x, this.y];
			let tile_i = Math.floor((current_point[0] + 1) / 2);
			let tile_j = Math.floor((current_point[1] + 1) / 2);

			let target_tile_i = Math.floor((player_x + 1) / 2);
			let target_tile_j = Math.floor((player_y + 1) / 2);
			
			let visited = new Set();
			
			while (tile_i != target_tile_i || tile_j != target_tile_j) {
				
				if (!visited.has([tile_i, tile_j])) {
					let tile = this.proc_gen.map[tile_i][tile_j];
					if (tile == 1) {
						return false;
					}
					visited.add([tile_i, tile_j]);
				}
				
				current_point = [current_point[0] + sight_vector[0], current_point[1] + sight_vector[1]];
				tile_i = Math.floor((current_point[0] + 1) / 2);
				tile_j = Math.floor((current_point[1] + 1) / 2);
			}

			return true;
		}


		seePlayer(player_x, player_y) {

			if (this.canCurrentlySeePlayer(player_x, player_y)) {
				this.current_remember_timeout = 0;				
			} else if (this.current_remember_timeout < this.max_remeber_timeout) {
				this.current_remember_timeout += 1;
				
			}

			if (this.current_remember_timeout >= this.max_remeber_timeout) {
				this.follow_player = false;
			} else {
				this.follow_player = true;
			}
			
		}
	}
	
export default Enemy