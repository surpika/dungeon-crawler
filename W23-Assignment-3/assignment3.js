import {defs, tiny} from './examples/common.js';
import Proc_Gen from './proc-gen.js';
import {map_width, map_height} from './proc-gen.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

export class Assignment3 extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();
		
		this.proc_gen = new Proc_Gen();

        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            torus: new defs.Torus(15, 15),
            torus2: new defs.Torus(3, 15),
            sphere: new defs.Subdivision_Sphere(4),
            circle: new defs.Regular_2D_Polygon(1, 15),
			square: new defs.Square(),
            cube: new defs.Cube(),
            cylinder: new defs.Capped_Cylinder(15, 15),
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
            // TODO:  Fill in as many additional material objects as needed in this key/value table.
            //        (Requirement 4)
        }

        const  data_members = {
            player_transform: Mat4.identity(),
            did_ud_move: false,
            udSpeed: 0,
            angle: 0,

			
			player_x: map_width - 1,
			player_y: map_height - 1,
			player_angle_of_view: Math.PI / 2,
			player_radius: 2,

			rotation_magnitude: 0,
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
			this.shapes.square.draw(context, program_state, transform, this.materials.test.override({color: color}));
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

		let walls_in_tile = [[], [], [], []]; //Top, Left, Bottom, Right

		if (tile.charAt(0) == '1') {
			// Top
			let wall_x = player_tile_i * 2;
			let wall_y = player_tile_j * 2 + 1;
			walls_output += ", top wall x: " + wall_x;
			walls_output += ", top wall y: " + wall_y;
			walls_in_tile[0] = [wall_x, wall_y];
		}
		if (tile.charAt(1) == '1') {
			// Left
			let wall_x = player_tile_i * 2 - 1;
			let wall_y = player_tile_j * 2;
			walls_output += ", left wall x: " + wall_x;
			walls_output += ", left wall y: " + wall_y;
			walls_in_tile[1] = [wall_x, wall_y];
		}
		if (tile.charAt(2) == '1') {
			// Bottom
			let wall_x = player_tile_i * 2;
			let wall_y = player_tile_j * 2 - 1;
			walls_output += ", bottom wall x: " + wall_x;
			walls_output += ", bottom wall y: " + wall_y;
			walls_in_tile[2] = [wall_x, wall_y];
		}
		if (tile.charAt(3) == '1') {
			// Right
			let wall_x = player_tile_i * 2 + 1;
			let wall_y = player_tile_j * 2;
			walls_output += ", right wall x: " + wall_x;
			walls_output += ", right wall y: " + wall_y;
			walls_in_tile[3] = [wall_x, wall_y];
		}		

		//this.printCollisionDebugOutput(player_tile_i, player_tile_j, walls_output);
		return walls_in_tile;
		
	}

	distance(x1, y1, x2, y2) {
		return Math.sqrt((x1-x2)**2 + (y1-y2)**2);
	}

	checkCircleLineCollision(line_orientation, line_coords, circle_x, circle_y, circle_radius) {
		if(line_orientation == 'x') {
			if(circle_x < line_coords[0] + 1 && circle_x > line_coords[0] - 1) {
				console.log("hi");
				if(Math.abs(circle_y - line_coords[1]) < circle_radius) {
					return true;
				}
			}
			else
			{
				let low_x_distance = this.distance(circle_x, circle_y, line_coords[0]-1, line_coords[1]) < circle_radius;
				let high_x_distance  = this.distance(circle_x, circle_y, line_coords[0]+1, line_coords[1]);
				if(low_x_distance < circle_radius || high_x_distance < circle_radius) {
					return true;
				}
			}
		}
		else if(line_orientation == 'y') {
			if(circle_y < line_coords[1] + 1 && circle_y > line_coords[1] - 1) {
				if(Math.abs(circle_y - line_coords[0]) < circle_radius) {
					return true;
				}
			}
			else
			{
				let low_y_distance = this.distance(circle_x, circle_y, line_coords[0], line_coords[1]-1);
				let high_y_distance = this.distance(circle_x, circle_y, line_coords[0], line_coords[1]+1);
				if(low_y_distance < circle_radius || high_y_distance < circle_radius) {
					return true;
				}
			}
		}
		return false;
	}

	getWallCollisions(x_walls, y_walls, actor_x, actor_y, actor_radius) {
		for (let i = 0; i < x_walls.length; i++) {
			let c = this.checkCircleLineCollision('x', x_walls[i], actor_x, actor_y, actor_radius);
			if(c) {
				console.log("colliding with x wall at " + x_walls[i]);
			}
		}
		for (let i = 0; i < y_walls.length; i++) {
			let c = this.checkCircleLineCollision('y', y_walls[i], actor_x, actor_y, actor_radius);
			if(c) {
				console.log("colliding with y wall at " + y_walls[i]);
			}
		}
	}

	handlePlayerCollision() {
		// Find i and j indices of tile that player is in
		let player_tile_i = Math.floor((this.player_x + 1) / 2);
		let player_tile_j = Math.floor((this.player_y + 1) / 2);
		let x_walls = [];
		let y_walls = [];
		let v = [[0,0], [0,1], [1,0], [0,-1], [-1,0]];
		for(let i  = 0; i < 5; i ++) {
			let tile_walls = this.getWallsInTile(player_tile_i + v[i][0], player_tile_j + v[i][1]);
			if(!(tile_walls[0] === undefined) && tile_walls[0].length > 0) {x_walls.push(tile_walls[0]);}
			if(!(tile_walls[2] === undefined) && tile_walls[2].length > 0) {x_walls.push(tile_walls[2]);}
			if(!(tile_walls[1] === undefined) && tile_walls[1].length > 0) {y_walls.push(tile_walls[1]);}
			if(!(tile_walls[3] === undefined) && tile_walls[3].length > 0) {y_walls.push(tile_walls[3]);}
		}

		this.getWallCollisions(x_walls, y_walls, this.player_x, this.player_y, this.player_radius);
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
        const light_position = vec4(map_width - 1, map_height - 1, 1, 1);
        // The parameters of the Light are: position, color, size
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

        // TODO:  Fill in matrix operations and drawing code to draw the solar system scene (Requirements 3 and 4)
        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        const yellow = hex_color("#fac91a");
		const pink = hex_color("#fe12b3");
		const green = hex_color("#3ec64b");
        const blue = hex_color("#0000FF");
		const gray = hex_color("#808080");
        let model_transform = Mat4.identity();

		for(let i = 0; i < map_width; i++) {
			for(let j = 0; j < map_height; j++) {
				let ij_transform = Mat4.identity().times(Mat4.translation(i*2, j*2, 0));
				if(this.proc_gen.map[i][j] == 0) {
					this.shapes.square.draw(context, program_state, ij_transform, this.materials.test.override({color: green}));
					//this.shapes.square.draw(context, program_state, ij_transform.times(Mat4.translation(0,0,2)), this.materials.test.override({color: gray}));
				}
				let code = this.proc_gen.tiles[i][j];
				if(code == '1111') {continue;}
				if(code.charAt(0) == '1') {
					this.drawSquare(context, program_state, ij_transform, Mat4.translation(0,1,1), Mat4.rotation(Math.PI/2,1,0,0), pink);}
				if(code.charAt(1) == '1') {
					this.drawSquare(context, program_state, ij_transform, Mat4.translation(-1,0,1), Mat4.rotation(Math.PI/2,0,1,0), pink);}
				if(code.charAt(2) == '1') {
					this.drawSquare(context, program_state, ij_transform, Mat4.translation(0,-1,1), Mat4.rotation(Math.PI/2,1,0,0), pink);}
				if(code.charAt(3) == '1') {
					this.drawSquare(context, program_state, ij_transform, Mat4.translation(1,0,1), Mat4.rotation(Math.PI/2,0,1,0), pink);}
			}
		}


        let cylinderTransform = this.player_transform;
        //cylinderTransform = cylinderTransform.times(Mat4.translation(-cylinderTransform[0], -cylinderTransform[1], 0))
        cylinderTransform = cylinderTransform.times(Mat4.scale(1,1, 1))
        cylinderTransform = this.cylinder_movement(program_state, cylinderTransform);
        cylinderTransform = this.draw_cylinder(context, program_state, cylinderTransform, blue);
        this.player_transform = cylinderTransform;

		// model_transform = Mat4.identity().times(Mat4.translation(map_width,map_height,0));
		// this.shapes.cube.draw(context, program_state, model_transform, this.materials.test.override({color: hex_color("fcba03")}));

		model_transform = Mat4.identity();
		this.shapes.cube.draw(context, program_state, model_transform, this.materials.test.override({color: hex_color("fcba03")}));


		// Handle Player Movement
		this.handlePlayerMovement();

		// console.log("Player x: " + this.player_x);
		// console.log("Player y: " + this.player_y);
		// console.log("Player a: " + this.player_angle_of_view);

		let camera = Mat4.look_at(vec3(this.player_x, this.player_y, 1), vec3(this.player_x + (5*Math.cos(this.player_angle_of_view)), this.player_y + (5*Math.sin(this.player_angle_of_view)), 1), vec3(0, 0, 1));
		program_state.set_camera(camera);

		this.rotate_player();

		this.handlePlayerCollision();		
    }


	// HELPER FUNCTIONS

	// Given center and radius of two circles
	// Return true if they overlap, otherwise false
	do_circles_collide(x1,y1,r1,x2,y2,r2) {
	    distance_of_centers = Math.sqrt((x1-x2)**2 + (y1-y2)**2);
	    return distance_of_centers < r1 + r2;
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

