import React, { Component } from 'react'
import './App.css'

const colors = ['orange','yellow','gray','white','red','blue','Chartreuse','purple','pink','Sienna','Aquamarine','SeaGreen']

const Pad = ({height, width}) => <div style={{height: height, width: width}} />

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
      numberCells: true,
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
        row.push(<div style={{
          width: boxSize,
          height: boxSize,
          position: 'relative',
          border: isCity ? '3px solid gray' : '1px solid black',
          display: 'inline-block',
          textAlign: 'center',
          verticalAlign: 'middle',
          lineHeight: `${boxSize}px`,
          backgroundColor: colors[4 + terrain[x+y*width]],
        }}>
          {numberCells && (
            <span style={{
              position: 'absolute',
              top: 2,
              right: 2,
              height: '12px',
              lineHeight: '12px',
              fontSize: '9px',
            }}>
              {x+y*width}
            </span>
          )}
          <span style={{zIndex: 1}}>
            {armies[x+y*width] !== 0 && armies[x+y*width]}
          </span>
          {isGeneral &&
            <span style={{
              width: '100%',
              position: 'absolute',
              top: -12,
              fontSize: '12px',
              left: 0,
              color: 'white',
            }}>
             	👑
            </span>
          }
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
