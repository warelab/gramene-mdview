import React, {Component} from 'react'
import {render} from 'react-dom'
// import 'bootstrap/dist/css/bootstrap.min.css'
import Example from '../../src'

class Demo extends Component {
  render() {
    return <Example
        org='warelab'
        repo='release-notes'
        path='test'
        heading='Tutorials'
        ifEmpty='A user guide is in development'
        date='2022-11-18'
      />
  }
}

render(<Demo/>, document.querySelector('#demo'))
