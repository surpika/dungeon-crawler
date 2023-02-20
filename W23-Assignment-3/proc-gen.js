const wall = 1;
const empty = 0;

const Proc_Gen =
	class Proc_Gen {
		constructor() {
			this.map = [];
			this.tiles = [];
			this.generate_map();
			console.log("testing");
		}
		
		generate_map() {
			for (let i = 0; i < 15; i++) {
				let row = [];
				for (let j = 0; j < 15; j++) {
					row.push(Math.round(Math.random()));
				}
				this.map.push(row);
			}
			for(let i = 6; i < 9; i++) {
				for(let j = 6; j < 9; j++) {
					this.map[i][j] = empty
				}
			}
			
			for(let i = 0; i < 15; i++) {
				let row = [];
				for (let j = 0; j < 15; j++) {
					row.push('1111'); //represents solid wall; render nothing.
				}
				this.tiles.push(row);
			}
			
			console.log([0, 1, 0, 1].join('') === '0101');
			for (let i = 0; i < 15; i++) {
				for(let j = 0; j < 15; j++) {
					if(this.map[i][j] == empty) {
						this.tiles[i][j] = 
						[
							+((i == 0) || this.map[i-1][j] == wall),
							+((j == 0) || this.map[i][j-1] == wall),
							+((i == 14) || this.map[i+1][j] == wall),
							+((j == 14) || this.map[i][j+1] == wall)
						].join(''); //write array in string format, e.g. '0101'
					}
				}
			}
			console.log(this.map);
			console.log(this.tiles);
			
			
		}
	}
	
export default Proc_Gen
