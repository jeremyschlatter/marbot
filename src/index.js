import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import './index.css'
import {game} from './main.js'

const app = ReactDOM.render(
  <App />,
  document.getElementById('root')
)

game.app = app

app.setState({
  width: 0,
  height: 0,
  armies: [],
  terrain: [],
  scores: []
})
