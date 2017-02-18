import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import './index.css'
import {game} from './main.js'

let app = ReactDOM.render(
  <App />,
  document.getElementById('root')
)

let state = {
  width: 0,
  height: 0,
  armies: [],
  terrain: [],
  scores: [],
}
game.onUpdate = newState => {
  state = newState
  app.setState(state)
}
app.setState(state)

if (module.hot) {
  module.hot.accept('./App', () => {
    const NextApp = require('./App').default
    app = ReactDOM.render(
      <NextApp />,
      root
    )
  })
}
