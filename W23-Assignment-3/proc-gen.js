import Enemy from "./enemy.js";

const wall = 1;
const empty = 0;

const map_width = 30;
const map_height = 30;
const map_density = 0.5// minimum percentage of empty tiles
const entropy = 0.5; // percent of time that snake will change direction.
const enemy_density = 0.01;

const Proc_Gen =
	class Proc_Gen {
		constructor(scene) {
			this.scene = scene;
			this.map = [];
			this.tiles = [];
			this.num_empty = map_width * map_height * map_density; //minimum number of empty tiles
			this.empty_tiles = []; //empty tiles
			this.generate_map();
			this.enemy_grid = [];
			this.enemies = [];
			this.generate_enemies();
		}
		
		generate_enemies() {
			for (let i = 0; i < map_width; i++) {
				let row = [];
				for (let j = 0; j < map_height; j++) {
					row.push([]);
				}
				this.enemy_grid.push(row);
			}
			
			let count = 0;
			while (count < this.empty_tiles.length * enemy_density) {
				let random_tile = this.empty_tiles[Math.floor(Math.random()*this.empty_tiles.length)];
				let new_enemy = new Enemy(this.scene, this, random_tile[0] * 2, random_tile[1] * 2);
				this.enemy_grid[random_tile[0]][random_tile[1]].push(new_enemy);
				this.enemies.push(new_enemy);
				count++;
			}
		}

		wall_fill() {
			for (let i = 0; i < map_width; i++) {
				let row = [];
				for (let j = 0; j < map_height; j++) {
					row.push(wall);
				}
				this.map.push(row);
			}
		}

		snake_gen(i, j, count, direction) {
			//console.log(i, j, count, direction);
			let directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
			if(count >= this.num_empty) {
				return;
			}
			if(i < 0 || i >= map_width || j < 0 || j >= map_width) {
				let random_tile = this.empty_tiles[Math.floor(Math.random()*this.empty_tiles.length)];
				this.snake_gen(random_tile[0], random_tile[1], count, directions[Math.floor(Math.random()*directions.length)]);
				return;
			}
			if(this.map[i][j] == wall) {
				count += 1;
			}
			this.map[i][j] = empty;
			this.empty_tiles.push([i, j]);

			if(Math.random() < entropy) {
				direction = directions[Math.floor(Math.random()*directions.length)];
			}
			this.snake_gen(i + direction[0], j + direction[1], count, direction);
		}
		
		create_spawn() {
			for(let i = Math.floor(map_width/2) -1; i < Math.ceil(map_width/2) + 1; i++) {
				for(let j = Math.floor(map_height/2) -1; j < Math.ceil(map_height/2) + 1; j++) {
					this.map[i][j] = empty;
					this.empty_tiles.push([i, j]);
				}
			}
		}
		
		generate_map() {
			this.wall_fill();
			this.create_spawn();
			let directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
			this.snake_gen(Math.floor(map_width/2), Math.floor(map_height/2), 9, directions[Math.floor(Math.random()*directions.length)]);
			
			for(let i = 0; i < map_width; i++) {
				let row = [];
				for (let j = 0; j < map_height; j++) {
					row.push('1111'); //represents solid wall; render nothing.
				}
				this.tiles.push(row);
			}
			
			for (let i = 0; i < map_width; i++) {
				for(let j = 0; j < map_height; j++) {
					if(this.map[i][j] == empty) {
						this.tiles[i][j] = 
						[
							+((j == map_height - 1) || this.map[i][j+1] == wall),
							+((i == 0) || this.map[i-1][j] == wall),
							+((j == 0) || this.map[i][j-1] == wall),
							+((i == map_width - 1) || this.map[i+1][j] == wall)
						].join(''); //write array in string format, e.g. '0101'
					}
				}
			}
			console.log(this.map);
			console.log(this.tiles);
			
			
		}
	}
	
export default Proc_Gen
export {map_width, map_height}