import {defs, tiny} from './examples/common.js';
import Proc_Gen from "./proc-gen.js";
import {map_width, map_height} from './proc-gen.js';
import {Shape_From_File} from "./examples/obj-file-demo.js";
import Enemy from "./enemy.js";

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture,
} = tiny;

export class Assignment3 extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();
		
		this.proc_gen = new Proc_Gen(this);

        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            torus: new defs.Torus(15, 15),
            torus2: new defs.Torus(3, 15),
            sphere: new defs.Subdivision_Sphere(4),
            circle: new defs.Regular_2D_Polygon(1, 15),
			square: new defs.Square(),
            cube: new defs.Cube(),
            cylinder: new defs.Capped_Cylinder(15, 15),
			teapot: new Shape_From_File("assets/teapot.obj"),
			goblin: new Shape_From_File("assets/goblin.OBJ"),
			skeleton: new Shape_From_File("assets/skeleton.obj"),
			cube2: new Shape_From_File("assets/cube.obj"),
			skeleton_torso: new Shape_From_File("assets/skeleton_torso.obj"),
			skeleton_leg_left: new Shape_From_File("assets/skeleton_leg_left.obj"),
			skeleton_leg_right: new Shape_From_File("assets/skeleton_leg_right.obj"),
			skeleton_arm_left: new Shape_From_File("assets/skeleton_arm_left.obj"),
			skeleton_arm_right: new Shape_From_File("assets/skeleton_arm_right.obj"),
			skeleton_sword_arm: new Shape_From_File("assets/skeleton_arm_left_sword.obj"),
			arrow: new Shape_From_File("assets/arrow.obj")
			// TODO:  Fill in as many additional shape instances as needed in this key/value table.
            //        (Requirement 1)
        };

        // *** Materials
        this.materials = {
            test: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#ffffff")}),
            test2: new Material(new Gouraud_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#992828")}),
            ring: new Material(new Ring_Shader()),
			dungeon_wall: new Material(new defs.Fake_Bump_Map(1), {
				color: color(.8, .8, .8, 1),
				ambient: .05, diffusivity: .9, specularity: .4, texture: new Texture("assets/dungeon_wall.jpg") // Assets can only be in Powers of 2 (EX: 1024 x 1024)
			}),
			dungeon_floor: new Material(new defs.Fake_Bump_Map(1), {
				//color: color(.894, .376, .267, 1),
				color: color(.8, .8, .8, 1),
				//ambient: .2, diffusivity: .5, specularity: .5, texture: new Texture("assets/floor.jpg") 
				ambient: .05, diffusivity: .9, specularity: .4, texture: new Texture("assets/floor.jpg") 
			}),
			bone: new Material(new defs.Fake_Bump_Map(1), {
				color: color(.8, .8, .8, 1), 
				ambient: .05, diffusivity: .9, specularity: .4, texture: new Texture("assets/bone.png")
			}), 
			wood_door: new Material(new defs.Fake_Bump_Map(1), {
				color: color(.8, .8, .8, 1), 
				ambient: .05, diffusivity: .9, specularity: .4, texture: new Texture("assets/wood_door.png")
			}), 
		}
            // TODO:  Fill in as many additional material objects as needed in this key/value table.
            //        (Requirement 4)

        const  data_members = {
            player_transform: Mat4.identity(),
            did_ud_move: false,
            udSpeed: 0,
            angle: 0,

			
			player_x: map_width - 1,
			player_y: map_height - 1,
			tick_initial_player_x: map_width - 1,
			tick_initial_player_y: map_height - 1,
			player_angle_of_view: Math.PI / 2,
			player_radius: 0.3,
			rotation_magnitude: 0,
			
			player_score: 0,
			current_floor: 1,

			projectiles: [], // [projectile_x, projectile_y, angle_of_direction]
			projectile_speed: .3,
			time_to_next_fire: 0, // current time until another projectile can be fired
			time_between_shots: 60, // minimum time until another projectile can be fired (60 -> 1 second)

			

			exit_tile_i: Math.floor(map_width / 2) - 1,
			exit_tile_j: Math.floor(map_height / 2) + 1,
        }
        Object.assign(this, data_members);


		// look_at(eye, at, up) {
  //           // look_at():  Produce a traditional graphics camera "lookat" matrix.
  //           // Each input must be a 3x1 Vector.
  //           // Note:  look_at() assumes the result will be used for a camera and stores its
  //           // result in inverse space.
  //           // If you want to use look_at to point a non-camera towards something, you can
  //           // do so, but to generate the correct basis you must re-invert its result.


        this.initial_camera_location = Mat4.look_at(vec3(this.player_x, this.player_y, 1), vec3(this.player_x, this.player_y + 5, 1), vec3(0, 0, 1));
    }

    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.key_triggered_button("View solar system", ["Control", "0"], () => this.attached = () => null);
        this.new_line();
        this.key_triggered_button("Attach to planet 1", ["Control", "1"], () => this.attached = () => this.planet_1);
        this.key_triggered_button("Attach to planet 2", ["Control", "2"], () => this.attached = () => this.planet_2);
        this.new_line();
        this.key_triggered_button("Attach to planet 3", ["Control", "3"], () => this.attached = () => this.planet_3);
        this.key_triggered_button("Attach to planet 4", ["Control", "4"], () => this.attached = () => this.planet_4);
        this.new_line();
        this.key_triggered_button("Attach to moon", ["Control", "m"], () => this.attached = () => this.moon);

		
		this.key_triggered_button("Fire Projectile", [" "], () => {
			if (this.time_to_next_fire <= 0) {
				let new_projectile = [this.player_x, this.player_y, this.player_angle_of_view];
				this.projectiles.push(new_projectile);
				//console.log(this.projectiles);
				this.time_to_next_fire = this.time_between_shots
			}
        });
		
        this.key_triggered_button("Go up,", ["ArrowUp"], () => {
            this.udSpeed = .1
            this.did_ud_move = true;
        }, undefined, () => {
            this.udSpeed = 0;
        });
        this.key_triggered_button("Go down,", ["ArrowDown"], () => {

            this.udSpeed = -0.1
            this.did_ud_move = true;
        }, undefined, () => {
            this.udSpeed = 0;
        });
        this.key_triggered_button("Go Left,", ["ArrowLeft"], () => {
            this.angle = 2*Math.PI / 180;
			this.rotation_magnitude = 1;
			//this.player_angle_of_view += 10*(2*Math.PI / 180);
        }, undefined, () => {
            this.rotation_magnitude = 0;
        });
        this.key_triggered_button("Go Right,", ["ArrowRight"], () => {
            this.angle = -(2*Math.PI / 180);
			this.rotation_magnitude = -1;
			//this.player_angle_of_view -= 10*(2*Math.PI / 180);
        }, undefined, () => {
            this.rotation_magnitude = 0;
        });
    }

	rotate_player() {
		this.player_angle_of_view += this.rotation_magnitude * (2*Math.PI / 180);
	}

    draw_cylinder(context, program_state, model_transform, box_color) {


        this.shapes.cylinder.draw(context, program_state, model_transform, this.materials.test.override({color:box_color}));
        return model_transform;
    }

    cylinder_movement(program_state, cylinderTransform) {
        let dx = this.udSpeed * Math.sin(this.angle);
        let dy = this.udSpeed * Math.cos(this.angle);
        cylinderTransform = cylinderTransform.times(Mat4.rotation(this.angle, 0, 0, 1));
        cylinderTransform = cylinderTransform.times(Mat4.translation(dx, dy, 0));

        /*this.initial_camera_location = Mat4.look_at(
            vec3(boxTransform[0], boxTransform[1], 1),
            vec3(14, 23,1),
            vec3(0,0,1));*/
        //program_state.set_camera(this.initial_camera_location);

        return cylinderTransform;
    }
	drawSquare(context, program_state, transform, translation, rotation, color) {
			transform = transform.times(translation).times(rotation);
			this.shapes.square.draw(context, program_state, transform, this.materials.dungeon_wall);
	}



	handlePlayerMovement() {
		let dx = this.udSpeed * Math.cos(this.player_angle_of_view);
		let dy = this.udSpeed * Math.sin(this.player_angle_of_view);

		this.player_x += dx;
		this.player_y += dy;
	}

	printCollisionDebugOutput(player_tile_i, player_tile_j, walls_output) {
		let str = "player x: " + this.player_x + ", player y: " + this.player_y + ", player_tile_i: " + player_tile_i + ", player_tile_j: " + player_tile_j + ", ";
		if(!(walls_output === undefined) || walls_output == "") {
			str += walls_output;
		}
		else {
			str = str + "no walls detected";
		}
		console.log(JSON.parse(JSON.stringify(str)));
	}

	getWallsInTile(player_tile_i, player_tile_j) {		
		if(player_tile_i < 0 || player_tile_i > 2*map_width/2 - 1 || player_tile_j < 0 || player_tile_j > 2*map_height/2 - 1) {
			//this.printCollisionDebugOutput(player_tile_i, player_tile_j);
			return [];
		}

		let tiles_to_check = 2;

		let tile = this.proc_gen.tiles[player_tile_i][player_tile_j];

		if(tile == '1111') {
			//this.printCollisionDebugOutput(player_tile_i, player_tile_j);
			return [];
		}

		// console.log(this.proc_gen.tiles);
		// console.log(tile);
		//console.log("i: " + player_tile_i + ", j: " + player_tile_j);

		let walls_output = "";

		let walls_in_tile = [];

		if (tile.charAt(0) == '1') {
			// Top
			let wall_x = player_tile_i * 2;
			let wall_y = player_tile_j * 2 + 1;
			walls_output += ", top wall x: " + wall_x;
			walls_output += ", top wall y: " + wall_y;
			walls_in_tile.push([wall_x, wall_y, 't']);
		}
		if (tile.charAt(1) == '1') {
			// Left
			let wall_x = player_tile_i * 2 - 1;
			let wall_y = player_tile_j * 2;
			walls_output += ", left wall x: " + wall_x;
			walls_output += ", left wall y: " + wall_y;
			walls_in_tile.push([wall_x, wall_y, 'l']);
		}
		if (tile.charAt(2) == '1') {
			// Bottom
			let wall_x = player_tile_i * 2;
			let wall_y = player_tile_j * 2 - 1;
			walls_output += ", bottom wall x: " + wall_x;
			walls_output += ", bottom wall y: " + wall_y;
			walls_in_tile.push([wall_x, wall_y, 'b']);
		}
		if (tile.charAt(3) == '1') {
			// Right
			let wall_x = player_tile_i * 2 + 1;
			let wall_y = player_tile_j * 2;
			walls_output += ", right wall x: " + wall_x;
			walls_output += ", right wall y: " + wall_y;
			walls_in_tile.push([wall_x, wall_y, 'r']);
		}		

		//this.printCollisionDebugOutput(player_tile_i, player_tile_j, walls_output);
		return walls_in_tile;
		
	}

	distance(x1, y1, x2, y2) {
		return Math.sqrt((x1-x2)**2 + (y1-y2)**2);
	}
	
	checkLineCollision(wall, circle_x, circle_y, circle_radius) {
		if(wall[2] == 't') {
			if(circle_x < wall[0] + 1 && circle_x > wall[0] - 1 && circle_y < wall[1]) { //check if in front of wall
				if(Math.abs(circle_y - wall[1]) < circle_radius) { //check if distance from wall less than radius
					return true;
				}
			}
		}
		if(wall[2] == 'l') {
			if(circle_y < wall[1] + 1 && circle_y > wall[1] - 1 && circle_x > wall[0]) { //check if in front of wall
				if(Math.abs(circle_x - wall[0]) < circle_radius) {
					return true;
				}
			}
		}
		if(wall[2] == 'b') {
			if(circle_x < wall[0] + 1 && circle_x > wall[0] - 1 && circle_y > wall[1]) { //check if in front of wall
				if(Math.abs(circle_y - wall[1]) < circle_radius) {
					return true;
				}
			}
		}
		if(wall[2] == 'r') {
			if(circle_y < wall[1] + 1 && circle_y > wall[1] - 1 && circle_x < wall[0]) {
				if(Math.abs(circle_x - wall[0]) < circle_radius) {
					return true;
				}
			}
		}
		return false;
	}
	
	checkCornerCollision(wall, circle_x, circle_y, circle_radius) {
		if(wall[2] == 't') {
			let corner_x = wall[0] - 1;
			let corner_y = wall[1];
			let collided = this.distance(circle_x, circle_y, corner_x, corner_y) < circle_radius;
			if(collided) {
				//console.log("top collision");
				return true;
			}
		}
		if(wall[2] == 'l') {
			let corner_x =  wall[0];
			let corner_y = wall[1] - 1;
			let collided = this.distance(circle_x, circle_y, corner_x, corner_y) < circle_radius;
			if(collided) {
				return true;
			}
		}
		if(wall[2] == 'b') {
			let corner_x = wall[0] + 1;
			let corner_y = wall[1];
			let collided = this.distance(circle_x, circle_y, corner_x, corner_y) < circle_radius;
			if(collided) {
				return true;
			}
		}
		if(wall[2] == 'r') {
			let corner_x = wall[0];
			let corner_y = wall[1] + 1;
			let collided = this.distance(circle_x, circle_y, corner_x, corner_y) < circle_radius;
			if(collided) {
				return true;
			}
		}
		return false;
	}
	
	getCornerCollisions(walls, actor_x, actor_y, actor_radius) {
		for (let i = 0; i < walls.length; i++) {
			let c = this.checkCornerCollision(walls[i], actor_x, actor_y, actor_radius);
			if(c) {
				return walls[i];
			}
		}
	}
	
	getLineCollisions(walls, actor_x, actor_y, actor_radius) {
		let collisions = [];
		for (let i = 0; i < walls.length; i++) {
			let c = this.checkLineCollision(walls[i], actor_x, actor_y, actor_radius);
			if(c) {
				collisions.push(walls[i]);
				if(collisions.length == 2) {return collisions;}
			}
		}
		return collisions;
	}

	//return [[wall_x, wall_y, wall_type], "collision_type"];
	getWallCollisions(walls, actor_x, actor_y, actor_radius) {
		let lines_collided = this.getLineCollisions(walls, actor_x, actor_y, actor_radius);
		if(lines_collided.length == 0) {
			let corner_collided = this.getCornerCollisions(walls, actor_x, actor_y, actor_radius);
			if(!(corner_collided === undefined)) {
				return [corner_collided, "corner"];
			}
		} else {
			return [lines_collided, "line"];
		}
		return [[], "no collision"];
	}
	
	resolveLineCollision(wall, actor_x, actor_y, actor_radius) {
		let x = wall[0];
		let y = wall[1];
		let wall_type = wall[2];
		let new_coords = [actor_x, actor_y];
		if(wall_type == 't') {new_coords[1] = y - actor_radius;}
		if(wall_type == 'l') {new_coords[0] = x + actor_radius;}
		if(wall_type == 'b') {new_coords[1] = y + actor_radius;}
		if(wall_type == 'r') {new_coords[0] = x - actor_radius;}
		return new_coords;
	}
	
	getNormalizedVectorFromCoords(x1, y1, x2, y2) { //[x1, y1] - [x2, y2]
		let v = [x1 - x2, y1 - y2];
		let magnitude = Math.sqrt(v[0]**2 + v[1]**2);
		let normalized = [v[0]/magnitude, v[1]/magnitude];
		return normalized;
	}
	
	resolveCornerCollision(wall, actor_x, actor_y, actor_radius) {
		let wall_x = wall[0];
		let wall_y = wall[1];
		let wall_type = wall[2];
		let corner_x = 0;
		let corner_y = 0;
		if(wall_type == 't') {
			corner_x = wall[0] - 1;
			corner_y = wall[1];
		} else if(wall_type == 'l') {
			corner_x =  wall[0];
			corner_y = wall[1] - 1;
		} else if(wall_type == 'b') {
			corner_x = wall[0] + 1;
			corner_y = wall[1];
		} else if(wall_type == 'r') {
			corner_x = wall[0];
			corner_y = wall[1] + 1;
		} else {console.log("invalid wall type");}
		let normalized = this.getNormalizedVectorFromCoords(actor_x, actor_y, corner_x, corner_y);
		let new_actor_coords = [corner_x + normalized[0] * actor_radius, corner_y + normalized[1] * actor_radius];
		return new_actor_coords;
	}
	
	handlePlayerInnerCornerCollision() {
		let player_tile_i = Math.floor((this.player_x + 1) / 2);
		let player_tile_j = Math.floor((this.player_y + 1) / 2);
		if(player_tile_i < 0 || player_tile_i > 2*map_width/2 - 1 || player_tile_j < 0 || player_tile_j > 2*map_height/2 - 1) {
			//this.printCollisionDebugOutput(player_tile_i, player_tile_j);
			return;
		}
		let tile = this.proc_gen.tiles[player_tile_i][player_tile_j];
		if(tile.charAt(0) == '1' && tile.charAt(1) == '1') { //top and left
			let top_wall_y = player_tile_j * 2 + 1;
			let left_wall_x = player_tile_i * 2 - 1;
			let top_boundary = top_wall_y - this.player_radius;
			let left_boundary = left_wall_x + this.player_radius;
			if(this.player_x < left_boundary) {
				this.player_x = left_boundary;
			}
			if(this.player_y > top_boundary) {
				this.player_y = top_boundary;
			}
		} if(tile.charAt(1) == '1' && tile.charAt(2) == '1') { //left and bottom
			let left_wall_x = player_tile_i * 2 - 1;
			let bottom_wall_y = player_tile_j * 2 -1;
			let left_boundary = left_wall_x + this.player_radius;
			let bottom_boundary = bottom_wall_y + this.player_radius;
			if(this.player_x < left_boundary) {
				this.player_x = left_boundary;
			}
			if(this.player_y < bottom_boundary) {
				this.player_y = bottom_boundary;
			}
		} if(tile.charAt(2) == '1' && tile.charAt(3) == '1') { //bottom and right
			let right_wall_x = player_tile_i * 2 + 1;
			let bottom_wall_y = player_tile_j * 2 -1;
			let right_boundary = right_wall_x - this.player_radius;
			let bottom_boundary = bottom_wall_y + this.player_radius;
			if(this.player_x > right_boundary) {
				this.player_x = right_boundary;
			}
			if(this.player_y < bottom_boundary) {
				this.player_y = bottom_boundary;
			}
		} if(tile.charAt(3) == '1' && tile.charAt(0) == '1') { //right and top
			let right_wall_x = player_tile_i * 2 + 1;
			let top_wall_y = player_tile_j * 2 + 1;
			let right_boundary = right_wall_x - this.player_radius;
			let top_boundary = top_wall_y - this.player_radius;
			if(this.player_x > right_boundary) {
				this.player_x = right_boundary;
			}
			if(this.player_y > top_boundary) {
				this.player_y = top_boundary;
			}
		}
	}
	
	handlePlayerCornerCollision() {
		// Find i and j indices of tile that player is in
		let player_tile_i = Math.floor((this.player_x + 1) / 2);
		let player_tile_j = Math.floor((this.player_y + 1) / 2);
		let v = [[0,0], [0,1], [1,0], [0,-1], [-1,0]];
		let local_walls = [];
		for(let i  = 0; i < 5; i ++) {
			let tile_walls = this.getWallsInTile(player_tile_i + v[i][0], player_tile_j + v[i][1]);
			local_walls = local_walls.concat(tile_walls);
		}
		
		//result: [[wall_x, wall_y, wall_type], "collision_type"]
		let wall = this.getCornerCollisions(local_walls, this.player_x, this.player_y, this.player_radius); //get corner collisions
		
		if(!(wall === undefined)) {
			let new_player_x = this.player_x;
			let new_player_y = this.player_y;
			let new_coords = this.resolveCornerCollision(wall, this.player_x, this.player_y, this.player_radius);
			new_player_x = new_coords[0];
			new_player_y = new_coords[1];

			this.player_x = new_player_x;
			this.player_y = new_player_y;
		}
		
		//below: resolve corner collision
		this.handlePlayerInnerCornerCollision();
	}

	handlePlayerCollision() {
		// Find i and j indices of tile that player is in
		let player_tile_i = Math.floor((this.player_x + 1) / 2);
		let player_tile_j = Math.floor((this.player_y + 1) / 2);
		let v = [[0,0], [0,1], [1,0], [0,-1], [-1,0]];
		let local_walls = [];
		for(let i  = 0; i < 5; i ++) {
			let tile_walls = this.getWallsInTile(player_tile_i + v[i][0], player_tile_j + v[i][1]);
			local_walls = local_walls.concat(tile_walls);
		}
		
		//result: [[wall_x, wall_y, wall_type], "collision_type"]
		let result = this.getWallCollisions(local_walls, this.player_x, this.player_y, this.player_radius); //get wall collisions
		
		//below: resolve collision, first check whether line or corner or none
		
		let new_player_x = this.player_x;
		let new_player_y = this.player_y;
		if(result[1] == "line") {
			for (let i = 0; i < result[0].length; i++) {
				let wall = result[0][i];
				let new_coords = this.resolveLineCollision(wall, new_player_x, new_player_y, this.player_radius);
				new_player_x = new_coords[0];
				new_player_y = new_coords[1];
			}
		}
		else if(result[1] == "corner") {
			let wall = result[0];
			let new_coords = this.resolveCornerCollision(wall, this.player_x, this.player_y, this.player_radius);
			new_player_x = new_coords[0];
			new_player_y = new_coords[1];
		}
		else if(result[1] != "no collision") {console.log("invalid wall collision type");}
		this.player_x = new_player_x;
		this.player_y = new_player_y;
		
		this.handlePlayerCornerCollision();
	}


	handleProjectileMovement() {
		for (let i = 0; i < this.projectiles.length; i++) {
			let projectile = this.projectiles[i];
			let projectile_x = projectile[0];
			let projectile_y = projectile[1];
			let projectile_angle = projectile[2];
			let dx = this.projectile_speed * Math.cos(projectile_angle);
			let dy = this.projectile_speed * Math.sin(projectile_angle);
			let new_x = projectile_x + dx;
			let new_y = projectile_y + dy;
			this.projectiles[i] = [new_x, new_y, projectile_angle];
		}
	}

	// NOT FULLY TESTED YET
	
	handleProjectileCollision() {
		for (let i = 0; i < this.projectiles.length; i++) {
			let projectile = this.projectiles[i];
			let projectile_x = projectile[0];
			let projectile_y = projectile[1];
			let tile_i = Math.floor((projectile_x + 1) / 2);
			let tile_j = Math.floor((projectile_y + 1) / 2);
			
			if (tile_i < 0 || tile_i >= map_width || tile_j < 0 || tile_j >= map_height) {
				//remove projectile
				this.projectiles.splice(i, 1);
			} else if (this.proc_gen.map[tile_i][tile_j] == 1) {
				//remove projectile
				this.projectiles.splice(i, 1);
			}

			
		}
	}

	
	displayProjectiles(context, program_state) {
		for (let i = 0; i < this.projectiles.length; i++) {
			let projectile = this.projectiles[i];
			console.log(projectile);
			let projectile_x = projectile[0];
			let projectile_y = projectile[1];
			let angle = projectile[2];
			let model_transform = Mat4.identity().times(Mat4.translation(projectile_x,projectile_y,1)).times(Mat4.scale(.2,.2,.2)).times(Mat4.rotation(-Math.PI/2, 0, 0, 1)).times(Mat4.rotation(Math.PI/2, Math.cos(angle), Math.sin(angle), 0));/*.times(Mat4.rotation(Math.PI/2, 1, 0,0))*/
			this.shapes.arrow.draw(context, program_state, model_transform, this.materials.wood_door);
		}
	}


	
	startNewFloor() {
		
		this.score += 20; // Score increased by reaching new floor
		this.current_floor += 1; // Current floor increased by one

		// Reset player coordinates and other movement variables
		this.player_x = map_width - 1;
		this.player_y = map_height - 1;
		this.tick_initial_player_x = map_width - 1;
		this.tick_initial_player_y = map_height - 1;
		this.player_angle_of_view = Math.PI / 2;
		this.rotation_magnitude = 0;

		// Reset projectiles and firing timer
		this.projectiles = []; // [projectile_x, projectile_y, angle_of_direction]
		this.time_to_next_fire = 0; // current time until another projectile can be fired

		// Generate new maze
		// MIGHT WANT TO VERIFY WE DON'T HAVE TO DELETE PREVIOUS OBJECT
		this.proc_gen = new Proc_Gen();

		// Generate new exit tile
		this.exit_tile_i = Math.floor(map_width / 2) - 1;
		this.exit_tile_j = Math.floor(map_height / 2) + 1;
	}
	
	checkIfExitReached() {
		let player_tile_i = Math.floor((this.player_x + 1) / 2);
		let player_tile_j = Math.floor((this.player_y + 1) / 2);

		if (player_tile_i == this.exit_tile_i && player_tile_j == this.exit_tile_j) {
			// Exit reached
			this.startNewFloor()
		}
	}
	
	handleEnemyInnerCornerCollision(enemy) {
		let enemy_tile_i = Math.floor((enemy.x + 1) / 2);
		let enemy_tile_j = Math.floor((enemy.y + 1) / 2);
		if(enemy_tile_i < 0 || enemy_tile_i > 2*map_width/2 - 1 || enemy_tile_j < 0 || enemy_tile_j > 2*map_height/2 - 1) {
			//this.printCollisionDebugOutput(player_tile_i, player_tile_j);
			return;
		}
		let tile = this.proc_gen.tiles[enemy_tile_i][enemy_tile_j];
		if(tile.charAt(0) == '1' && tile.charAt(1) == '1') { //top and left
			let top_wall_y = enemy_tile_j * 2 + 1;
			let left_wall_x = enemy_tile_i * 2 - 1;
			let top_boundary = top_wall_y - enemy.radius;
			let left_boundary = left_wall_x + enemy.radius;
			if(enemy.x < left_boundary) {
				enemy.x = left_boundary;
			}
			if(enemy.y > top_boundary) {
				enemy.y = top_boundary;
			}
		} if(tile.charAt(1) == '1' && tile.charAt(2) == '1') { //left and bottom
			let left_wall_x = enemy_tile_i * 2 - 1;
			let bottom_wall_y = enemy_tile_j * 2 -1;
			let left_boundary = left_wall_x + enemy.radius;
			let bottom_boundary = bottom_wall_y + enemy.radius;
			if(enemy.x < left_boundary) {
				enemy.x = left_boundary;
			}
			if(enemy.y < bottom_boundary) {
				enemy.y = bottom_boundary;
			}
		} if(tile.charAt(2) == '1' && tile.charAt(3) == '1') { //bottom and right
			let right_wall_x = enemy_tile_i * 2 + 1;
			let bottom_wall_y = enemy_tile_j * 2 -1;
			let right_boundary = right_wall_x - enemy.radius;
			let bottom_boundary = bottom_wall_y + enemy.radius;
			if(enemy.x > right_boundary) {
				enemy.x = right_boundary;
			}
			if(enemy.y < bottom_boundary) {
				enemy.y = bottom_boundary;
			}
		} if(tile.charAt(3) == '1' && tile.charAt(0) == '1') { //right and top
			let right_wall_x = enemy_tile_i * 2 + 1;
			let top_wall_y = enemy_tile_j * 2 + 1;
			let right_boundary = right_wall_x - enemy.radius;
			let top_boundary = top_wall_y - enemy.radius;
			if(enemy.x > right_boundary) {
				enemy.x = right_boundary;
			}
			if(enemy.y > top_boundary) {
				enemy.y = top_boundary;
			}
		}
	}
	
	handleEnemyCornerCollision(enemy) {
		// Find i and j indices of tile that enemy is in
		let player_tile_i = Math.floor((enemy.x + 1) / 2);
		let player_tile_j = Math.floor((enemy.y + 1) / 2);
		let v = [[0,0], [0,1], [1,0], [0,-1], [-1,0]];
		let local_walls = [];
		for(let i  = 0; i < 5; i ++) {
			let tile_walls = this.getWallsInTile(player_tile_i + v[i][0], player_tile_j + v[i][1]);
			local_walls = local_walls.concat(tile_walls);
		}
		
		//result: [[wall_x, wall_y, wall_type], "collision_type"]
		let wall = this.getCornerCollisions(local_walls, enemy.x, enemy.y, enemy.radius); //get corner collisions
		
		if(!(wall === undefined)) {
			let new_x = enemy.x;
			let new_y = enemy.y;
			let new_coords = this.resolveCornerCollision(wall, enemy.x, enemy.y, enemy.radius);
			new_x = new_coords[0];
			new_y = new_coords[1];

			enemy.x = new_x;
			enemy.y = new_y;
		}
		
		//below: resolve corner collision
		this.handleEnemyInnerCornerCollision(enemy);
	}
	
	handleEnemyCollision() {
		for(let i = 0; i < this.proc_gen.enemies.length; i ++) {
			let enemy = this.proc_gen.enemies[i];
			// Find i and j indices of tile that enemy is in
			let enemy_tile_i = Math.floor((enemy.x + 1) / 2);
			let enemy_tile_j = Math.floor((enemy.y + 1) / 2);
			let v = [[0,0], [0,1], [1,0], [0,-1], [-1,0]];
			let local_walls = [];
			for(let i  = 0; i < 5; i ++) {
				let tile_walls = this.getWallsInTile(enemy_tile_i + v[i][0], enemy_tile_j + v[i][1]);
				local_walls = local_walls.concat(tile_walls);
			}
			
			//result: [[wall_x, wall_y, wall_type], "collision_type"]
			let result = this.getWallCollisions(local_walls, enemy.x, enemy.y, enemy.radius); //get wall collisions
			
			//below: resolve collision, first check whether line or corner or none
			
			let new_x = enemy.x;
			let new_y = enemy.y;
			if(result[1] == "line") {
				for (let i = 0; i < result[0].length; i++) {
					let wall = result[0][i];
					let new_coords = this.resolveLineCollision(wall, new_x, new_y, enemy.radius);
					new_x = new_coords[0];
					new_y = new_coords[1];
				}
			}
			else if(result[1] == "corner") {
				let wall = result[0];
				let new_coords = this.resolveCornerCollision(wall, enemy.x, enemy.y, enemy.radius);
				new_x = new_coords[0];
				new_y = new_coords[1];
			}
			else if(result[1] != "no collision") {console.log("invalid wall collision type");}
			enemy.x = new_x;
			enemy.y = new_y;
			
			this.handleEnemyCornerCollision(enemy);
		}
		
	}

	checkCirclesCollision(x1,y1,r1,x2,y2,r2) {

		let distance = Math.sqrt( (x1-x2)**2 + (y1-y2)**2 );
		let total_radius = r1 + r2;

		return distance < total_radius;
		
	}

	
	
	performEnemyActions() {

		// Set current tiles of each enemy
		this.proc_gen.setEnemyTiles();

		// Iterate through all enemies
		for (let i = 0; i < this.proc_gen.enemies.length; i++) {

			// Get current enemy
			let enemy = this.proc_gen.enemies[i];

			// Perform enemy action
			enemy.performAction(this.player_x, this.player_y);

			// Check for collision with player
			let collide = this.checkCirclesCollision(this.player_x, this.player_y, this.player_radius, enemy.x, enemy.y, enemy.radius);
			if (collide) {
				enemy.x = enemy.tick_initial_x;
				enemy.y = enemy.tick_initial_y;
				continue;
			}

			// Check for collision with other enemies
			let enemies_around_this_enemy = this.proc_gen.getEnemiesAround(enemy.tile_i, enemy.tile_j);
			enemies_around_this_enemy = enemies_around_this_enemy.filter(item => item !== enemy);

			for (let close_enemy of enemies_around_this_enemy) {
				collide = this.checkCirclesCollision(enemy.x, enemy.y, enemy.radius, close_enemy.x, close_enemy.y, close_enemy.radius);
				if (collide) {
					enemy.x = enemy.tick_initial_x;
					enemy.y = enemy.tick_initial_y;
				}
			}
			
			
		}
	}

    display(context, program_state) {
        // display():  Called once per frame of animation.
        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            // program_state.set_camera(this.initial_camera_location);
        }

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, .1, 1000);

        // TODO: Create Planets (Requirement 1)
        // this.shapes.[XXX].draw([XXX]) // <--example

        // TODO: Lighting (Requirement 2)
        let light_position = vec4(map_width - 1, map_height - 1, 1, 1);
        // The parameters of the Light are: position, color, size
		light_position = vec4(this.player_x, this.player_y, 1, 1);
        program_state.lights = [new Light(light_position, color(1, 0.6, 0.5, 1), 20)];

        // TODO:  Fill in matrix operations and drawing code to draw the solar system scene (Requirements 3 and 4)
        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        const yellow = hex_color("#fac91a");
		const pink = hex_color("#fe12b3");
		const green = hex_color("#3ec64b");
        const blue = hex_color("#0000FF");
		const gray = hex_color("#808080");
		const black = hex_color("#000000");
        let model_transform = Mat4.identity();

		for(let i = 0; i < map_width; i++) {
			for(let j = 0; j < map_height; j++) {
				let ij_transform = Mat4.identity().times(Mat4.translation(i*2, j*2, 0));
				if(this.proc_gen.map[i][j] == 0) {
					if (i == this.exit_tile_i && j == this.exit_tile_j) {
						this.shapes.square.draw(context, program_state, ij_transform, this.materials.wood_door);
					}
					else {
						this.shapes.square.draw(context, program_state, ij_transform, this.materials.dungeon_floor); //ambient 0.05
					}
					
					this.shapes.square.draw(context, program_state, ij_transform.times(Mat4.translation(0,0,2)).times(Mat4.rotation(Math.PI, 1, 0, 0)), this.materials.dungeon_floor);
				}
				let code = this.proc_gen.tiles[i][j];
				if(code == '1111') {continue;}
				if(code.charAt(0) == '1') {
					this.drawSquare(context, program_state, ij_transform, Mat4.translation(0,1,1), Mat4.rotation(Math.PI/2,1,0,0), pink);}
				if(code.charAt(1) == '1') {
					this.drawSquare(context, program_state, ij_transform, Mat4.translation(-1,0,1), Mat4.rotation(Math.PI/2,0,1,0).times(Mat4.rotation(Math.PI/2, 0, 0, 1)), pink);}
				if(code.charAt(2) == '1') {
					this.drawSquare(context, program_state, ij_transform, Mat4.translation(0,-1,1), Mat4.rotation(Math.PI/2,-1,0,0), pink);}
				if(code.charAt(3) == '1') {
					this.drawSquare(context, program_state, ij_transform, Mat4.translation(1,0,1), Mat4.rotation(Math.PI/2,0,-1,0).times(Mat4.rotation(Math.PI/2, 0, 0, 1)), pink);}
			}
		}


        //let cylinderTransform = this.player_transform;
        //cylinderTransform = cylinderTransform.times(Mat4.translation(-cylinderTransform[0], -cylinderTransform[1], 0))
        //cylinderTransform = cylinderTransform.times(Mat4.scale(1,1, 1))
        //cylinderTransform = this.cylinder_movement(program_state, cylinderTransform);
        //ylinderTransform = this.draw_cylinder(context, program_state, cylinderTransform, blue);
        //this.player_transform = cylinderTransform;

		// model_transform = Mat4.identity().times(Mat4.translation(map_width,map_height,0));
		// this.shapes.cube.draw(context, program_state, model_transform, this.materials.test.override({color: hex_color("fcba03")}));

		//model_transform = Mat4.identity();
		//this.shapes.cube.draw(context, program_state, model_transform, this.materials.test.override({color: hex_color("fcba03")}));

		//save player's position in case they need to be moved back due to collision
		this.tick_initial_player_x = this.player_x;
		this.tick_initial_player_y = this.player_y;
		
		this.rotate_player();
		
		// Handle Player Movement
		this.handlePlayerMovement();

		// console.log("Player x: " + this.player_x);
		// console.log("Player y: " + this.player_y);
		// console.log("Player a: " + this.player_angle_of_view);
		
		this.handlePlayerCollision();

		this.checkIfExitReached();


		// Adjust firing timer if needed
		if (this.time_to_next_fire > 0) {
			this.time_to_next_fire -= 1;
		}

		this.handleProjectileMovement();
		this.handleProjectileCollision();
		this.displayProjectiles(context, program_state);
		
		this.performEnemyActions();
		this.handleEnemyCollision();
		
		//display enemies
		for (let i = 0; i < this.proc_gen.enemies.length; i++) {
			let enemy = this.proc_gen.enemies[i];
			let enemy_transform = Mat4.identity().times(Mat4.translation(enemy.x, enemy.y, 1)).times(Mat4.scale(0.15, 0.15, 0.15)).times(Mat4.rotation(Math.PI/2, 1, 0, 0)).times(Mat4.rotation(enemy.angle_of_view + Math.PI/2, 0, 1, 0));
			this.shapes.skeleton_torso.draw(context, program_state, enemy_transform, this.materials.bone);
			
			if(enemy.follow_player) {
				let m = Math.sin(t * Math.PI);
				
				let leg_transform = Mat4.identity().times(Mat4.translation(enemy.x, enemy.y, 0.15)).times(Mat4.scale(0.15, 0.15, 0.15)).times(Mat4.rotation(Math.PI/2, 1, 0, 0)).times(Mat4.rotation(enemy.angle_of_view + Math.PI/2, 0, 1, 0)).times(Mat4.translation(-0.5, Math.abs(Math.PI/4 * m), -2.2 * m)).times(Mat4.rotation(m * Math.PI/4, 1, 0, 0));
				this.shapes.skeleton_leg_left.draw(context, program_state, leg_transform, this.materials.bone);
				//let right_leg_transform = leg_transform.times(Mat4.translation(1, 0, 0));
				let right_leg_transform = Mat4.identity().times(Mat4.translation(enemy.x, enemy.y, 0.15)).times(Mat4.scale(0.15, 0.15, 0.15)).times(Mat4.rotation(Math.PI/2, 1, 0, 0)).times(Mat4.rotation(enemy.angle_of_view + Math.PI/2, 0, 1, 0)).times(Mat4.translation(0.5, Math.abs(Math.PI/4 * m), 2.2 * m)).times(Mat4.rotation(-m * Math.PI/4, 1, 0, 0));
				this.shapes.skeleton_leg_right.draw(context, program_state, right_leg_transform, this.materials.bone);
				let arm_transform = Mat4.identity().times(Mat4.translation(enemy.x, enemy.y, 0.6)).times(Mat4.scale(0.10, 0.10, 0.10)).times(Mat4.rotation(Math.PI/2, 1, 0, 0)).times(Mat4.rotation(enemy.angle_of_view + Math.PI/2, 0, 1, 0)).times(Mat4.translation(-1.5, Math.abs(Math.PI/4 * m), 3.5 * m)).times(Mat4.rotation(Math.PI/2, 0, 0, 1)).times(Mat4.rotation(m * Math.PI/4, 0, 1 ,0));
				this.shapes.skeleton_sword_arm.draw(context, program_state, arm_transform, this.materials.bone);
				let right_arm_transform = Mat4.identity().times(Mat4.translation(enemy.x, enemy.y, 0.6)).times(Mat4.scale(0.15, 0.15, 0.15)).times(Mat4.rotation(Math.PI/2, 1, 0, 0)).times(Mat4.rotation(enemy.angle_of_view + Math.PI/2, 0, 1, 0)).times(Mat4.translation(1.1, Math.abs(Math.PI/4 * m), -2.2 * m)).times(Mat4.rotation(Math.PI/2, 0, 0, -1)).times(Mat4.rotation(m * Math.PI/4, 0, 1 ,0));;
				this.shapes.skeleton_arm_right.draw(context, program_state, right_arm_transform, this.materials.bone);
			}
			else {
				let leg_transform = Mat4.identity().times(Mat4.translation(enemy.x, enemy.y, 0.15)).times(Mat4.scale(0.15, 0.15, 0.15)).times(Mat4.rotation(Math.PI/2, 1, 0, 0)).times(Mat4.rotation(enemy.angle_of_view + Math.PI/2, 0, 1, 0)).times(Mat4.translation(-0.5, 0, 0));
				this.shapes.skeleton_leg_left.draw(context, program_state, leg_transform, this.materials.bone);
				let right_leg_transform = leg_transform.times(Mat4.translation(1, 0, 0));
				this.shapes.skeleton_leg_right.draw(context, program_state, right_leg_transform, this.materials.bone);
				let arm_transform = Mat4.identity().times(Mat4.translation(enemy.x, enemy.y, 0.6)).times(Mat4.scale(0.15, 0.15, 0.15)).times(Mat4.rotation(Math.PI/2, 1, 0, 0)).times(Mat4.rotation(enemy.angle_of_view + Math.PI/2, 0, 1, 0)).times(Mat4.translation(-1.1, 0, 0)).times(Mat4.rotation(Math.PI/2, 0, 0, 1));
				this.shapes.skeleton_arm_left.draw(context, program_state, arm_transform, this.materials.bone);
				let right_arm_transform = Mat4.identity().times(Mat4.translation(enemy.x, enemy.y, 0.6)).times(Mat4.scale(0.15, 0.15, 0.15)).times(Mat4.rotation(Math.PI/2, 1, 0, 0)).times(Mat4.rotation(enemy.angle_of_view + Math.PI/2, 0, 1, 0)).times(Mat4.translation(1.1, 0, 0)).times(Mat4.rotation(Math.PI/2, 0, 0, -1));
				this.shapes.skeleton_arm_right.draw(context, program_state, right_arm_transform, this.materials.bone);
			}
			
		}

		//this.shapes.teapot.draw(context, program_state, Mat4.identity().times(Mat4.translation(this.player_x +2 ,this.player_y + 2,0)).times(Mat4.rotation(Math.PI/2, 1, 0, 0)), this.materials.dungeon_floor);
		//this.shapes.goblin.draw(context, program_state, Mat4.identity().times(Mat4.translation(this.player_x -2 ,this.player_y - 2,0)).times(Mat4.rotation(Math.PI/2, 1, 0, 0)), this.materials.dungeon_floor);
		//this.shapes.skeleton.draw(context, program_state, Mat4.identity().times(Mat4.translation(this.player_x +1 ,this.player_y + 1,1)).times(Mat4.scale(0.3, 0.3, 0.3).times(Mat4.rotation(Math.PI/12, 1, 0, 0))), this.materials.bone);
		//this.shapes.skeleton.draw(context, program_state, Mat4.identity().times(Mat4.translation(this.player_x +2 ,this.player_y + 2,1)).times(Mat4.scale(0.3, 0.3, 0.3).times(Mat4.rotation(Math.PI/2, 1, 0, 0))), this.materials.bone);

		let camera = Mat4.look_at(vec3(this.player_x, this.player_y, 1), vec3(this.player_x + (5*Math.cos(this.player_angle_of_view)), this.player_y + (5*Math.sin(this.player_angle_of_view)), 1), vec3(0, 0, 1));
		program_state.set_camera(camera);
    }

	
}

class Gouraud_Shader extends Shader {
    // This is a Shader using Phong_Shader as template
    // TODO: Modify the glsl coder here to create a Gouraud Shader (Planet 2)

    constructor(num_lights = 2) {
        super();
        this.num_lights = num_lights;
    }

    shared_glsl_code() {
        // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        return ` 
        precision mediump float;
        const int N_LIGHTS = ` + this.num_lights + `;
        uniform float ambient, diffusivity, specularity, smoothness;
        uniform vec4 light_positions_or_vectors[N_LIGHTS], light_colors[N_LIGHTS];
        uniform float light_attenuation_factors[N_LIGHTS];
        uniform vec4 shape_color;
        uniform vec3 squared_scale, camera_center;

        // Specifier "varying" means a variable's final value will be passed from the vertex shader
        // on to the next phase (fragment shader), then interpolated per-fragment, weighted by the
        // pixel fragment's proximity to each of the 3 vertices (barycentric interpolation).
        varying vec3 N, vertex_worldspace;
        // ***** PHONG SHADING HAPPENS HERE: *****                                       
        vec3 phong_model_lights( vec3 N, vec3 vertex_worldspace ){                                        
            // phong_model_lights():  Add up the lights' contributions.
            vec3 E = normalize( camera_center - vertex_worldspace );
            vec3 result = vec3( 0.0 );
            for(int i = 0; i < N_LIGHTS; i++){
                // Lights store homogeneous coords - either a position or vector.  If w is 0, the 
                // light will appear directional (uniform direction from all points), and we 
                // simply obtain a vector towards the light by directly using the stored value.
                // Otherwise if w is 1 it will appear as a point light -- compute the vector to 
                // the point light's location from the current surface point.  In either case, 
                // fade (attenuate) the light as the vector needed to reach it gets longer.  
                vec3 surface_to_light_vector = light_positions_or_vectors[i].xyz - 
                                               light_positions_or_vectors[i].w * vertex_worldspace;                                             
                float distance_to_light = length( surface_to_light_vector );

                vec3 L = normalize( surface_to_light_vector );
                vec3 H = normalize( L + E );
                // Compute the diffuse and specular components from the Phong
                // Reflection Model, using Blinn's "halfway vector" method:
                float diffuse  =      max( dot( N, L ), 0.0 );
                float specular = pow( max( dot( N, H ), 0.0 ), smoothness );
                float attenuation = 1.0 / (1.0 + light_attenuation_factors[i] * distance_to_light * distance_to_light );
                
                vec3 light_contribution = shape_color.xyz * light_colors[i].xyz * diffusivity * diffuse
                                                          + light_colors[i].xyz * specularity * specular;
                result += attenuation * light_contribution;
            }
            return result;
        } `;
    }

    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        return this.shared_glsl_code() + `
            attribute vec3 position, normal;                            
            // Position is expressed in object coordinates.
            
            uniform mat4 model_transform;
            uniform mat4 projection_camera_model_transform;
    
            void main(){                                                                   
                // The vertex's final resting place (in NDCS):
                gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
                // The final normal vector in screen space.
                N = normalize( mat3( model_transform ) * normal / squared_scale);
                vertex_worldspace = ( model_transform * vec4( position, 1.0 ) ).xyz;
            } `;
    }

    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        // A fragment is a pixel that's overlapped by the current triangle.
        // Fragments affect the final image or get discarded due to depth.
        return this.shared_glsl_code() + `
            void main(){                                                           
                // Compute an initial (ambient) color:
                gl_FragColor = vec4( shape_color.xyz * ambient, shape_color.w );
                // Compute the final color with contributions from lights:
                gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
            } `;
    }

    send_material(gl, gpu, material) {
        // send_material(): Send the desired shape-wide material qualities to the
        // graphics card, where they will tweak the Phong lighting formula.
        gl.uniform4fv(gpu.shape_color, material.color);
        gl.uniform1f(gpu.ambient, material.ambient);
        gl.uniform1f(gpu.diffusivity, material.diffusivity);
        gl.uniform1f(gpu.specularity, material.specularity);
        gl.uniform1f(gpu.smoothness, material.smoothness);
    }

    send_gpu_state(gl, gpu, gpu_state, model_transform) {
        // send_gpu_state():  Send the state of our whole drawing context to the GPU.
        const O = vec4(0, 0, 0, 1), camera_center = gpu_state.camera_transform.times(O).to3();
        gl.uniform3fv(gpu.camera_center, camera_center);
        // Use the squared scale trick from "Eric's blog" instead of inverse transpose matrix:
        const squared_scale = model_transform.reduce(
            (acc, r) => {
                return acc.plus(vec4(...r).times_pairwise(r))
            }, vec4(0, 0, 0, 0)).to3();
        gl.uniform3fv(gpu.squared_scale, squared_scale);
        // Send the current matrices to the shader.  Go ahead and pre-compute
        // the products we'll need of the of the three special matrices and just
        // cache and send those.  They will be the same throughout this draw
        // call, and thus across each instance of the vertex shader.
        // Transpose them since the GPU expects matrices as column-major arrays.
        const PCM = gpu_state.projection_transform.times(gpu_state.camera_inverse).times(model_transform);
        gl.uniformMatrix4fv(gpu.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        gl.uniformMatrix4fv(gpu.projection_camera_model_transform, false, Matrix.flatten_2D_to_1D(PCM.transposed()));

        // Omitting lights will show only the material color, scaled by the ambient term:
        if (!gpu_state.lights.length)
            return;

        const light_positions_flattened = [], light_colors_flattened = [];
        for (let i = 0; i < 4 * gpu_state.lights.length; i++) {
            light_positions_flattened.push(gpu_state.lights[Math.floor(i / 4)].position[i % 4]);
            light_colors_flattened.push(gpu_state.lights[Math.floor(i / 4)].color[i % 4]);
        }
        gl.uniform4fv(gpu.light_positions_or_vectors, light_positions_flattened);
        gl.uniform4fv(gpu.light_colors, light_colors_flattened);
        gl.uniform1fv(gpu.light_attenuation_factors, gpu_state.lights.map(l => l.attenuation));
    }

    update_GPU(context, gpu_addresses, gpu_state, model_transform, material) {
        // update_GPU(): Define how to synchronize our JavaScript's variables to the GPU's.  This is where the shader
        // recieves ALL of its inputs.  Every value the GPU wants is divided into two categories:  Values that belong
        // to individual objects being drawn (which we call "Material") and values belonging to the whole scene or
        // program (which we call the "Program_State").  Send both a material and a program state to the shaders
        // within this function, one data field at a time, to fully initialize the shader for a draw.

        // Fill in any missing fields in the Material object with custom defaults for this shader:
        const defaults = {color: color(0, 0, 0, 1), ambient: 0, diffusivity: 1, specularity: 1, smoothness: 40};
        material = Object.assign({}, defaults, material);

        this.send_material(context, gpu_addresses, material);
        this.send_gpu_state(context, gpu_addresses, gpu_state, model_transform);
    }
}

class Ring_Shader extends Shader {
    update_GPU(context, gpu_addresses, graphics_state, model_transform, material) {
        // update_GPU():  Defining how to synchronize our JavaScript's variables to the GPU's:
        const [P, C, M] = [graphics_state.projection_transform, graphics_state.camera_inverse, model_transform],
            PCM = P.times(C).times(M);
        context.uniformMatrix4fv(gpu_addresses.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        context.uniformMatrix4fv(gpu_addresses.projection_camera_model_transform, false,
            Matrix.flatten_2D_to_1D(PCM.transposed()));
    }

    shared_glsl_code() {
        // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        return `
        precision mediump float;
        varying vec4 point_position;
        varying vec4 center;
        `;
    }

    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        // TODO:  Complete the main function of the vertex shader (Extra Credit Part II).
        return this.shared_glsl_code() + `
        attribute vec3 position;
        uniform mat4 model_transform;
        uniform mat4 projection_camera_model_transform;
        
        void main(){
          
        }`;
    }

    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        // TODO:  Complete the main function of the fragment shader (Extra Credit Part II).
        return this.shared_glsl_code() + `
        void main(){
          
        }`;
    }
}

