import React, { Component } from 'react'
import './App.css'
import crown from './crown.png'
import city from './city.png'
import obstacle from './obstacle.png'
import mountain from './mountain.png'

const colors = ['rgba(56,56,56,1)','rgba(56,56,56,1)','gray','#DCDCDC','red','blue','Chartreuse','purple','pink','Sienna','Aquamarine','SeaGreen']

const Pad = ({height, width}) => <div style={{height: height, width: width}} />

const TILE_EMPTY = -1
const TILE_MOUNTAIN = -2
const TILE_FOG = -3
const TILE_FOG_OBSTACLE = -4 // Cities and Mountains show up as Obstacles in the fog of war.

class App extends Component {
  constructor() {
    super()
    this.state = {
      width: 0,
      height: 0,
      armies: [],
      terrain: [],
      scores: [],
      cities: [],
      usernames: [],
      generals: [],
      numberCells: false,
    }
  }
  render() {
    let cells = []
    let {
      width,
      height,
      armies,
      terrain,
      scores,
      cities,
      usernames,
      generals,
      numberCells,
    } = this.state
    let scorebox = []
    for (let p = 0; p < scores.length; p++){
      let ind = scores[p].i
      let score = []
      scorebox.push(<div>
        <div style = {{
          width: 150,
          display: 'inline-block',
          textAlign: 'center',
          verticalAlign: 'middle',
        }}>
          {usernames[ind]}
        </div>
        <div style = {{
          width: 50,
          display: 'inline-block',
          textAlign: 'center',
          verticalAlign: 'middle',
        }}>
          {scores[p].total}
        </div>
        <div style={{
          width: 35,
          display: 'inline-block',
          textAlign: 'center',
          verticalAlign: 'middle',
        }}>
          {scores[p].tiles}
        </div>
      </div>)
    }
    const boxSize = 35
    for (let y = 0; y < height; y++) {
      let row = []
      for (let x = 0; x < width; x++) {
        let isCity = cities.indexOf(x+y*width) !== -1
        let isGeneral = generals.indexOf(x+y*width) !== -1
        let isFog = false
        let image = null
        if (isGeneral) {
          image = `url(${crown})`
        } else if (isCity) {
          image = `url(${city})`
        } else if (terrain[x+y*width] == TILE_FOG_OBSTACLE) {
          image = `url(${obstacle})`
          isFog = true
        } else if (terrain[x+y*width] == TILE_FOG) {
          isFog = true
        } else if (terrain[x+y*width] == TILE_MOUNTAIN) {
          image = `url(${mountain})`
        }
        row.push(<div style={{
          width: boxSize,
          height: boxSize,
          position: 'relative',
          border: isFog ? null : '1px solid black',
          display: 'inline-block',
          textAlign: 'center',
          verticalAlign: 'middle',
          lineHeight: `${boxSize}px`,
          backgroundColor: colors[4 + terrain[x+y*width]],
          backgroundImage: image,
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'contain',
        }}>
          {numberCells && (
            <span style={{
              position: 'absolute',
              top: 2,
              right: 2,
              height: '12px',
              lineHeight: '12px',
              fontSize: '8px',
              color: 'white',
              fontWeight: 100,
            }}>
              {x+y*width}
            </span>
          )}
          <span style={{zIndex: 1, color: 'white', fontWeight: 100, fontSize: '13px'}}>
            {armies[x+y*width] !== 0 && armies[x+y*width]}
          </span>
        </div>)
      }
      cells.push(<div style={{height: boxSize}}>
        {row}    </div>)
    }

    return (
      <div className="App" style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
        }}>
        <div style={{display: 'inline-block'}}>
          {cells}
        </div>
        <div style={{display: 'inline-block'}}>
          {scorebox}
          <Pad height={20} />
          <label>
            Show cell numbers
            <input
              type='checkbox'
              checked={numberCells}
              onChange={() => this.setState({
                numberCells: !numberCells
              })}
            />
          </label>
        </div>
      </div>
    )
  }
}

export default App;
