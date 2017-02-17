var io = require('socket.io-client');
var socket = io('http://botws.generals.io');

import * as util from './util.js'
import config from './config.js'
import * as m from './moves.js'

let game = {
	app: {setState: () => 0},
}

socket.on('disconnect', function() {
	console.error('Disconnected from server.');
	process.exit(1);
});

socket.on('connect', function() {
	console.log('Connected to server.');

	var user_id = config.USER_ID;
	var username = config.USERNAME;

	// Set the username for the bot.
	socket.emit('set_username', user_id, username);

	// Join a custom game and force start immediately.
	// Custom games are a great way to test your bot while you develop it because you can play against your bot!
	socket.emit('join_private', config.ROOM_NAME, user_id);
	socket.emit('set_force_start', config.ROOM_NAME, true);
	console.log('Joined custom game at http://bot.generals.io/games/' + encodeURIComponent(config.ROOM_NAME));

	// When you're ready, you can have your bot join other game modes.
	// Here are some examples of how you'd do that:

	// Join the 1v1 queue.
	// socket.emit('join_1v1', user_id);

	// Join the FFA queue.
	// socket.emit('play', user_id);

	// Join a 2v2 team.
	// socket.emit('join_team', 'team_name', user_id);
});

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
function recurseSearch(state, depth, timeleft) {
	var start = performance.now()
	//find all moves
	var moves = m.getNextMoves(state)
	//if end of stack, just return highest scoring move
	if (depth === 0) return m.bestMove(state, moves)
	if (moves.length === 0) return [-1, -1, 0, 0]
	moves.sort(function(a, b){
		if (a[2] < b[2]) return 1
	  if (a[2] > b[2]) return -1
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
		if (a[2] < b[2]) return 1
	  if (a[2] > b[2]) return -1
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
			var startpos = m.listStartPos(state)
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

// gameWon and gameLost should be one function, but with the correct message.
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
