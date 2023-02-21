const wall = 1;
const empty = 0;

const map_width = 2; // minimum 2, recommended under 30
const map_height = 2; // minimum 2, recommended under 30

const Proc_Gen =
	class Proc_Gen {
		constructor() {
			this.map = [];
			this.tiles = [];
			this.generate_map();
			console.log("testing");
		}
		
		generate_map() {
			for (let i = 0; i < map_width; i++) {
				let row = [];
				for (let j = 0; j < map_height; j++) {
					row.push(Math.round(Math.random()));
				}
				this.map.push(row);
			}
			for(let i = Math.floor(map_width/2) -1; i < Math.ceil(map_width/2) + 1; i++) {
				for(let j = Math.floor(map_height/2) -1; j < Math.ceil(map_height/2) + 1; j++) {
					this.map[i][j] = empty
					console.log("i", i);
					console.log("j", j);
				}
			}
			
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
							+((i == 0) || this.map[i-1][j] == wall),
							+((j == 0) || this.map[i][j-1] == wall),
							+((i == map_width - 1) || this.map[i+1][j] == wall),
							+((j == map_height - 1) || this.map[i][j+1] == wall)
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