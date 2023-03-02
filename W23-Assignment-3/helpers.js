import Enemy from "./enemy.js";

const PQElement = 
	class PQElement {
		constructor(value, priority) {
			this.value = value;
			this.priority = priority;
		}
	}

const PriorityQueue =
	class PriorityQueue {
		constructor() {
			this.elems = [];
		}
		
		put(value, priority) {
			let put = false;
			for(let i = 0; i < this.elems.length; i++) {
				if(this.elems && this.elems[i].priority >= priority) {
					this.elems.splice(i, 0, new PQElement(value, priority));
					put = true;
					break;
				}
			}
			if(!put) {
				this.elems.push(new PQElement(value, priority));
			}
		}
		
		get() {
			if(this.elems.length > 0) {
				return this.elems.shift().value;
			}
		}
	}
	
const PathNode =
	class PathNode {
		constructor(state, mommy, cost, evaluation) {
			this.state = state;
			this.state1 = state;
			this.mommy = mommy;
			this.cost = cost;
			this.evaluation = evaluation;
		}
	}
	
var getFromDict = function(dict, target) {
	console.log("get from dict target: " + target);
	for (let i = 0; i < dict.length; i++) {
		if(JSON.stringify(dict[i][0]) == JSON.stringify(target)) {
			return dict[i][1];
		}
	}
	return null;
}

var setInDict = function(dict, target, value) {
	console.log("set in dict target: " + target);
	for (let i = 0; i < dict.length; i++) {
		if(JSON.stringify(dict[i][0]) == JSON.stringify(target)) {
			dict[i][1] = value;
		}
	}
	return null;	
}

export { PQElement, PriorityQueue, PathNode, getFromDict, setInDict }