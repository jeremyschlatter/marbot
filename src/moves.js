import * as util from './util.js'

// Terrain Constants.
// Any tile with a nonnegative value is owned by the player corresponding to its value.
// For example, a tile with value 1 is owned by the player with playerIndex = 1.
var TILE_EMPTY = -1
var TILE_MOUNTAIN = -2
var TILE_FOG = -3
var TILE_FOG_OBSTACLE = -4 // Cities and Mountains show up as Obstacles in the fog of war.


function scoreMove(state, startInd, endInd) {
	var score = 0

	// claiming territory
	if (state.terrain[endInd] === TILE_EMPTY) score+=2
	//enemy square
	if (state.terrain[endInd] > -1 && state.terrain[endInd] !== state.playerIndex) {
		//have more armies
		if (state.armies[startInd] >= state.armies[endInd] + 2) {
			if (state.cities.indexOf(endInd) !== -1) score+= 5
			if (state.generals.indexOf[endInd]) score+= 200
			score+= 3 + Math.sqrt(state.terrain[startInd])
		}
	}

	// I'm not sure why this is making my people hide in the corner.
	// if enemy general
	for (var i = 0; i < state.generals.length; i++) {
		if (i !== state.playerIndex && state.generals[i] !== -1) {
			var start_dist = util.distance(state, startInd, state.generals[i])
			var end_dist = util.distance(state, endInd, state.generals[i])

      util.distance(state, endInd, i)
			score -= Math.sqrt(end_dist)/10
		}
	}

	var neighbors = util.neighbors(state, endInd)
	for (var i = 0; i < neighbors.length; i++) {
	//good if fog, better if fogstacle, best if another player
		if (state.terrain[neighbors[i]] === TILE_FOG) score+= .3
		if (state.terrain[neighbors[i]] === TILE_FOG_OBSTACLE) score+= .4
		if (state.terrain[neighbors[i]] > -1 && state.terrain[neighbors[i]] !== state.playerIndex) score+= .5
		//if neighbor with big fat generals
		if (state.generals.indexOf[neighbors[i]]) score+=8
	}
  var sizeEnd = state.armies[endInd]
  if (state.terrain[endInd] === state.playerIndex) score += Math.sqrt(sizeEnd)/15
  score += Math.sqrt(state.armies[startInd])/10
  score += Math.random()
  return score
}

function listStartPos(state) {
	let startInds = []

	for (var i = 1; i < state.size; i++){
		if (state.armies[i] > 1 && state.terrain[i] === state.playerIndex) {
			startInds.push(i)
		}
	}
	return startInds
}

function getNextMoves(state) {
	let startInds = listStartPos(state)
	let endInds = []
	let moves = []
	for (var i = 0; i < startInds.length; i++){
		endInds = listEndInds(state, startInds[i])
		for (var j = 0; j < endInds.length; j++) {
			moves.push([startInds[i], endInds[j], scoreMove(state, startInds[i], endInds[j]), 0])
		}
	}
	return moves
}

function listEndInds(state, ind) {
	let endInds = []
	var options = [ind + state.width, ind + 1, ind - state.width, ind - 1]
	for (var i = 0; i < 4; i++) {
		if (isLegalandGood(state, ind, options[i]) === true) {
			var endInd = [ind, options, 0, 0]
			endInds.push(options[i])
		}
	}
	return endInds
}

//return all movements as [startInd, endInd, score, is50]
function bestMove(state, moves) {
	if (moves.length === 0) return [-1,-1,-1,0]
	var bestMoveInd = 0
	var bestScore = 0
	for (var i = 0; i < moves.length; i++) {
		var score = moves[i][2]
		if (score > bestScore) {
			bestScore = score
			bestMoveInd = i
		}
	}
	return [moves[bestMoveInd][0], moves[bestMoveInd][1], bestScore, 0]
}

function isLegalandGood(state, startInd, endInd) {
	//out of bounds
	var h = state.height
	var w = state.width
	if (endInd < 0 || endInd > state.size) return false

	//move tries to wrap board left<->right
	if (startInd%w === 0 && endInd%w === w - 1) return false
	if (endInd%w === 0 && startInd%w === w - 1) return false
	//move wraps top<->bottom
	if (endInd/w === 0 && startInd/w === h) return false
	if (startInd/w === 0 && endInd/w === h) return false
	if (state.terrain[endInd] === -2) {
		return false
	}

	if (startInd === endInd) return false

	if (state.cities.indexOf(endInd) !== -1) {
		if (state.armies[startInd] < state.armies[endInd]+2) {
			return false
		}
	}

	if (state.terrain[endInd] !== state.playerIndex) {
		if (state.armies[startInd] < state.armies[endInd]+2) {
			return false
		}
	}
	return true
}


export {getNextMoves, bestMove, listStartPos}
