import React, {Component} from 'react'
import {render} from 'react-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import Example from '../../src'

class Demo extends Component {
  render() {
    return <div>
      <h1>mdViewer Demo</h1>
      <Example
        org='warelab'
        repo='release-notes'
        path='oryza-guides'
        heading='Guides'
        ifEmpty='A user guide is in development'
      />
    </div>
  }
}

render(<Demo/>, document.querySelector('#demo'))
