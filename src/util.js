function patch(old, diff) {
	var out = [];
	var i = 0;
	while (i < diff.length) {
		if (diff[i]) {  // matching
			Array.prototype.push.apply(out, old.slice(out.length, out.length + diff[i]));
		}
		i++;
		if (i < diff.length && diff[i]) {  // mismatching
			Array.prototype.push.apply(out, diff.slice(i + 1, i + 1 + diff[i]));
			i += diff[i];
		}
		i++;
	}
	return out;
}

function distance(state, start, goal) {
	var Srow = Math.floor(start / state.width);
	var Scol = start % state.width;

	var Erow = Math.floor(goal / state.width);
	var Ecol = goal % state.width;

	return Math.abs(Srow - Erow) + Math.abs(Scol - Ecol)
}

function neighbors(state, ind) {
	var w = state.width
	var h = state.height
	var neighbors = [ind+1, ind-1, ind+w, ind-w, ind+w+1, ind+w-1, ind-w+1, ind-w-1]
	var final = []
	for (var i = 0; i < 8; i++){
		var endInd = neighbors[i]
		// on board at all
		if (endInd >= 0 && endInd < state.size + 1) {
			if (ind%w === 0 && endInd%w === w - 1) {
			} else if (endInd%w === 0 && ind%w === w - 1) {
			//move wraps top<->bottom
			}else if (endInd/w === 0 && ind/w === h){
			}else if (ind/w === 0 && endInd/w === h){
			}else {
				final.push(endInd)
			}
		}
	}
	return final
}

export {patch, distance, neighbors}
