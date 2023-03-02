import {defs, tiny} from './examples/common.js';
import {map_width, map_height} from './proc-gen.js';
import {PriorityQueue, PathNode, getFromDict, setInDict} from './helpers.js';
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
				speed: 0.025,
				current_remember_timeout: 10,
				max_remeber_timeout: 10,
				debug_pathfound: false
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
		
		//pathfinding
		getAdjacentEmptyTiles(tile) {
			let directions = [[0,1], [1,0], [0,-1], [-1,0]];
			let tiles = [];
			//console.log(this.proc_gen.map);
			for (let d of directions) {
				if(tile[0] + d[0] < 0 || tile[0] + d[0] >= map_width || tile[1] + d[1] < 0 || tile[1] + d[1] >= map_height) { continue; }
				if (this.proc_gen.map.length <= tile[0] + d[0]) { console.log(tile[0] + d[0]); }
				if(this.proc_gen.map[tile[0] + d[0]][tile[1] + d[1]] == 0) {
					tiles.push([tile[0] + d[0], tile[1] + d[1]]);
				}
			}
			return tiles;
		}
		
		getDiagonalEmptyTiles(tile) {
			let directions2 = [[1,1], [1,-1], [-1,1],[-1,-1]];
			let tiles = [];
			for(let d of directions2) {
				if(tile[0] + d[0] < 0 || tile[0] + d[0] >= map_width || tile[1] + d[1] < 0 || tile[1] + d[1] >= map_height) { continue; }
				if (this.proc_gen.map.length <= tile[0] + d[0]) { console.log(tile[0] + d[0]); }
				
				let check1 = this.proc_gen.map[tile[0] + d[0]][tile[1] + d[1]] == 0;
				let check2 = this.proc_gen.map[tile[0]][tile[1] + d[1]] == 0;
				let check3 = this.proc_gen.map[tile[0] + d[0]][tile[1]] == 0;
				if(check1 && (check2 || check3)) {
					tiles.push([tile[0] + d[0], tile[1] + d[1]]);
				}
			}
			return tiles;
		}
		
		isPlayerTile(tile) {
			let player_tile_i = Math.floor((this.scene.player_x + 1) / 2);
			let player_tile_j = Math.floor((this.scene.player_y + 1) / 2);
			return (tile[0] == player_tile_i) && (tile[1] == player_tile_j);
		}
		
		distanceToPlayer(tile) {
			let player_tile_i = Math.floor((this.scene.player_x + 1) / 2);
			let player_tile_j = Math.floor((this.scene.player_y + 1) / 2);
			return Math.sqrt((tile[0] - player_tile_i)**2  + (tile[1] - player_tile_j)**2);
		}
		
		a_star_search(start_state) {
			
			let visit_grid = [];
			for (var i = 0; i < this.proc_gen.map.length; i++) {
				visit_grid[i] = this.proc_gen.map[i].slice();
			}
			
			let pq = new PriorityQueue();
			
			//console.log(this.distanceToPlayer(start_state));
			let initial_node = new PathNode(start_state, null, 0, this.distanceToPlayer(start_state));
			pq.put(initial_node);
			let explored = [];
			
			let node_generated = 1;
			let node_expanded = 0;
			
			let count = 0;
			//console.log(pq.elems.length);
			
			while(pq.elems.length > 0) {
				console.log(count);
				console.log(JSON.parse(JSON.stringify(pq.elems)));
				
				let node = pq.get();
				
				console.log(node.state1);
				
				let i = node.state1[0];
				let j = node.state1[1];
				visit_grid[i][j] = 2;
				
				if (this.isPlayerTile(node.state1)) {
					console.log("found goal. " + count + " tiles checked.");
					visit_grid[node.state[0]][node.state[1]] = 3;
					visit_grid[Math.floor((this.x + 1) / 2)][Math.floor((this.y + 1) / 2)] = 4
					console.table(visit_grid);
					//console.log(this.distanceToPlayer(node.state));
					return node;
				}
				console.log("explored: " + explored);
				let old_cost = getFromDict(explored, node.state);
				console.log("old cost: " + old_cost);
				if ((old_cost !== null) && old_cost <= node.cost) {
					continue;
				}
				console.log("node state: " + node.state + ", node cost: " + node.cost);
				if(old_cost  === null) {
					explored.push([node.state, node.cost]);
				} else {
					setInDict(explored, node.state, node.cost);
				}
				
				let adjacent_successors = this.getAdjacentEmptyTiles(node.state1);
				node_expanded += 1;
				
				for (let s of adjacent_successors) {
					let new_cost = node.cost + 1;
					let new_node = new PathNode(s, node, new_cost, new_cost + this.distanceToPlayer(s));
					node_generated += 1;
					if(getFromDict(explored, new_node.state) == null) {
						pq.put(new_node, new_cost + this.distanceToPlayer(s));
					}
				}
				
				let diagonal_successors = this.getDiagonalEmptyTiles(node.state1);
				
				for (let s of diagonal_successors) {
					let new_cost = node.cost + Math.sqrt(2);
					let new_node = new PathNode(s, node, new_cost, new_cost + this.distanceToPlayer(s));
					node_generated += 1;
					if(getFromDict(explored, new_node.state) == null) {
						pq.put(new_node, new_cost + this.distanceToPlayer(s));
					}
				}
				
				count++;
				if(count == 450) {
					//break;
				}
			}
			return null;
		}

		getPathToPlayer() {
			let tile_i = Math.floor((this.x + 1) / 2);
			let tile_j = Math.floor((this.y + 1) / 2);
			let start_state = [tile_i, tile_j];
			let goal_node = this.a_star_search(start_state);
			if(goal_node !== null) {
				let node = goal_node;
				let path = [node.state1];
				
				while(node.mommy) {
					node = node.mommy;
					path.push(node.state1);
				}
				path.reverse();
				return path;
			} else {
				console.log("could not find a path");
				return null;
			}
		}
		
		performAction(player_x, player_y) {
			this.tick_initial_x = this.x;
			this.tick_initial_y = this.y;

			this.seePlayer(player_x, player_y);

			if(this.follow_player) {
				this.face_at(player_x, player_y);
				this.moveForward();
			}
			if(!this.debug_pathfound) {
				let path = this.getPathToPlayer()
				if(path.length > 0) {
					console.log("path: " + path);
				} else {
					console.log("path is null");
				}
				//this.debug_pathfound = true;
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
					let tile = this.proc_gen.map[tile_i][tile_j]; //occasional error: cannot read property of undefined reading
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
