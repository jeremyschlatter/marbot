var io = require('socket.io-client');
var socket = io('http://botws.generals.io');

import * as util from './util.js'
import config from './config.js'

let game = {
	app: {setState: () => 0},
}

socket.on('disconnect', function() {
	console.error('Disconnected from server.');
	process.exit(1);
});

socket.on('connect', function() {
	console.log('Connected to server.');

	/* Don't lose this user_id or let other people see it!
	 * Anyone with your user_id can play on your bot's account and pretend to be your bot.
	 * If you plan on open sourcing your bot's code (which we strongly support), we recommend
	 * replacing this line with something that instead supplies the user_id via an environment variable, e.g.
	 * var user_id = process.env.BOT_USER_ID;
	 */
	var user_id = config.USER_ID;
	var username = '[Bot] Marbot';

	// Set the username for the bot.
	socket.emit('set_username', user_id, username);

	// Join a custom game and force start immediately.
	// Custom games are a great way to test your bot while you develop it because you can play against your bot!
	var custom_game_id = 'my_game';
	socket.emit('join_private', custom_game_id, user_id);
//	socket.emit('join_1v1', user_id);
//	socket.emit('play', user_id);
	socket.emit('set_force_start', custom_game_id, true);
	//console.log('Joined custom game at http://bot.generals.io/games/' + encodeURIComponent(custom_game_id));

	// When you're ready, you can have your bot join other game modes.
	// Here are some examples of how you'd do that:

	// Join the 1v1 queue.

	// Join the FFA queue.


	// Join a 2v2 team.
	// socket.emit('join_team', 'team_name', user_id);
});
//
// Terrain Constants.
// Any tile with a nonnegative value is owned by the player corresponding to its value.
// For example, a tile with value 1 is owned by the player with playerIndex = 1.
var TILE_EMPTY = -1
var TILE_MOUNTAIN = -2
var TILE_FOG = -3
var TILE_FOG_OBSTACLE = -4 // Cities and Mountains show up as Obstacles in the fog of war.

var DISCOUNT = .7
var RECURSE_LEVEL = 2
// Game data.
var s = {
	playerIndex: 0,
	cities: [],
	generals: [],
	map: [],
	terrain: [],
	armies: [],
	height: 0,
	width: 0,
	size: 0,
}

var lastStart = -1
var lastEnd = -1
var replay_url = ""
var usernames = []

var time = performance.now()

Set.prototype.union = function(setB) {
    var union = new Set(this);
    for (var elem of setB) {
        union.add(elem);
    }
    return union;
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

function listNeighbors(state, ind) {
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
//
//is this correct? could it be messing things up?
function distance(state, start, goal) {
	var Srow = Math.floor(start / state.width);
	var Scol = start % state.width;

	var Erow = Math.floor(goal / state.width);
	var Ecol = goal % state.width;

	return Math.abs(Srow - Erow) + Math.abs(Scol - Ecol)
}

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
			var start_dist = distance(state, startInd, i)
			var end_dist = distance(state, endInd, i)
			score -= Math.sqrt(end_dist)/10
		}
	}

	var neighbors = listNeighbors(state, endInd)
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

//assumes move is valid
//ignores uptick in turn number adding armies for now
function virtualStateUpdate(state, move) {
	var startInd = move[0]
	var endInd = move[1]
	var newState = JSON.parse(JSON.stringify(state));
	var sizeMoving = state.armies[startInd]
	var sizeEnd = sizeMoving
	if (state.terrain[endInd] !== state.playerIndex) sizeEnd = state.armies[endInd] - sizeMoving
	if (state.terrain[endInd] === state.playerIndex) sizeEnd = state.armies[endInd] + sizeMoving
	newState.armies[startInd] = 1
	if (sizeEnd > 0) {
		if (state.terrain[endInd] === -1) sizeEnd--
		newState.terrain[endInd] = s.playerIndex
		newState.armies[endInd] = sizeEnd
	} else {
		newState.armies[endInd] = state.armies[endInd] - sizeMoving
	}
	return newState
}

//given a state, returns move + top score
//recursively!

//state-> find all moves -> rank all moves
//for each move -> new state
//	-> find all moves -> rank all moves (time discount)
//repeat. Highest ranking chain -> execute first move in chain
function recurseSearch(state, depth, timeleft) {
	var start = performance.now()
	//find all moves
	var moves = getNextMoves(state)
	//if end of stack, just return highest scoring move
	if (depth === 0) return bestMove(state, moves)
	if (moves.length === 0) return [-1, -1, 0, 0]
	moves.sort(function(a, b){
		if (a[2] < b[2]) {
	    return 1
	  }
	  if (a[2] > b[2]) {
	    return -1
	  }
	  // a must be equal to b
	  return 0
	})
	var bestMoveInd = 0
	var bestScore = 0
	for (var j = 0; j < Math.min(moves.length, 2 + 2*depth); j ++) {
		if (timeleft < 5) return [moves[bestMoveInd][1], moves[bestMoveInd][2], bestScore, 0]
		var newState = virtualStateUpdate(state, moves[j])
		var end = performance.now()
		var score = moves[j][2] + recurseSearch(newState, depth - 1, timeleft-end+start)[2] * DISCOUNT
		moves[j][2] = score
		if (score > bestScore) {
			bestScore = score
			bestMoveInd = j
		}
	}
	moves.sort(function(a, b){
		if (a[2] < b[2]) {
	    return 1
	  }
	  if (a[2] > b[2]) {
	    return -1
	  }
	  // a must be equal to b
	  return 0
	})
//	console.log(depth, moves.length, moves.slice(0,10))
	return moves[0]
}

socket.on('game_start', function(data) {
	// Get ready to start playing the game.
	s.playerIndex = data.playerIndex;
	usernames = data.usernames
	replay_url = 'http://bot.generals.io/replays/' + encodeURIComponent(data.replay_id);
	console.log('Game starting! The replay will be available after the game at ' + replay_url);
	time = performance.now()
})

function updateState(data) {
	s.map = util.patch(s.map, data.map_diff)

	s.scores = data.scores
	s.turn = data.turn

	data.cities = util.patch(s.cities, data.cities_diff)
	data.terrain = s.map.slice(s.size + 2, s.size + 2 + s.size)
	data.armies = s.map.slice(2, s.size + 2)
	if (s.turn <= 1) {
		s.generals = data.generals
		s.width = s.map[0]
		s.height = s.map[1]
		s.size = s.width * s.height

		s.cities = util.patch(s.cities, data.cities_diff)
		s.terrain = s.map.slice(s.size + 2, s.size + 2 + s.size)
		s.armies = s.map.slice(2, s.size + 2)
	} else {
		//only update generals, cities, terrain if the value is going from -1 -> actual knowledge
		for (var i = 0; i < data.generals.length; i++) { // [-1, 161]
			if (data.generals[i] !== -1) s.generals[i] = data.generals[i]
		}
		for (var c of data.cities) {
			if (s.cities.indexOf(c) !== -1) s.cities.push(c)
		}

		for (var i = 0; i < s.size; i++) {
			if (data.terrain[i] !== TILE_FOG && data.terrain[i] !== TILE_FOG_OBSTACLE) s.terrain[i] = data.terrain[i]
			if (data.armies[i] !== 0) s.armies[i] = data.armies[i]
			if (s.terrain[i] === s.playerIndex && data.terrain[i] !== s.playerIndex) s.terrain[i] = data.terrain[i]
		}
	}
}

socket.on('game_update', function(data) {
	updateState(data)

	var width = s.width
	var height = s.height
	var armies = s.armies
	var terrain = s.terrain
	var cities = s.cities
	var scores = s.scores
	var generals = s.generals

	game.app.setState({width, height, armies, terrain, scores, cities, usernames, generals})
	gameUpdate(s)
})

function gameUpdate(state) {
	//console.log(state.scores)
	if (state.turn > 2) {
		var move = recurseSearch(state, RECURSE_LEVEL, 500)
		var startInd = move[0]
		var endInd = move[1]
		var score = move[2]

		if (move[0] === -1 || move[2] === 0 || (startInd === lastEnd && endInd === lastStart) || (startInd === lastStart && endInd === lastEnd && Math.random() < .2)) {
			console.log('random move')
			// Make a random move.
			// Pick a random tile.
			var startpos = listStartPos(state)
			var randpos = Math.floor(Math.random() * startpos.length);
			var index = startpos[randpos]
			// If we own this tile, make a random move starting from it.
			var row = Math.floor(index / state.width);
			var col = index % state.width;
			var endIndex = index;

			var rand = Math.random();
			if (rand < 0.25 && col > 0) { // left
				endIndex--;
			} else if (rand < 0.5 && col < state.width - 1) { // right
				endIndex++;
			} else if (rand < 0.75 && row < state.height - 1) { // down
				endIndex += state.width;
			} else if (row > 0) { //up
				endIndex -= state.width;
			}

			// Would we be attacking a city? Don't attack cities.
			if (!state.cities.indexOf(endIndex) >= 0) {
				socket.emit('attack', index, endIndex);
				console.log(index, endIndex)
				lastStart = index
				lastEnd = endInd
			}
		} else {
			lastStart = startInd
			lastEnd = endInd
			socket.emit('attack', startInd, endInd)
			console.log(move)
		}
	}
}

//I want won and lost to be same function, but with different messages. Hmm.
function gameWon() {
	console.log('You won!!!')
	console.log(s.generals)
	console.log(replay_url)
	socket.emit('leave_game')
}
function gameLost() {
	console.log('You lost.')
	console.log(replay_url)
	socket.emit('leave_game')
}

socket.on('game_lost', gameLost)

socket.on('game_won', gameWon)

export {game}
