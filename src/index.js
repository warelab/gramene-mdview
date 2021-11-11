import React, { Component } from 'react'
import remarkGfm from 'remark-gfm'
import { Remark } from 'react-remark'
import remarkHeading from 'remark-heading-id'
import imgLinks from '@pondorasti/remark-img-links'
import { Container, Row, Col, Navbar, Nav, Table } from 'react-bootstrap'
import '../css/mdview.css'

export default class extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentFile: 0
    }
  }
  componentDidMount() {
    const md_regex = /---[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]\.md$/i;
    const url = `https://api.github.com/repos/${this.props.org}/${this.props.repo}/contents/${this.props.path}`
    fetch(url)
      .then(response => response.json())
      .then(data => {
      const now = this.props.date ? new Date(this.props.date) : new Date();
      const mdFiles = data.filter(f => md_regex.test(f.name))
        .map(f => {
          f.name = f.name.replace(/\.[^/.]+$/, "");
          const [name,datestr] = f.name.split('---');
          f.name = name;
          f.date = new Date(datestr);
          return f;
        })
        .filter(f => f.date < now)
        .sort((a,b) => {
          if (a.date < b.date) {
            return 1;
          }
          if (a.date > b.date) {
            return -1;
          }
          return 0;
        });
        this.setState({files: mdFiles});
        mdFiles.forEach(f => {
          fetch(f.download_url)
            .then(response => response.text())
            .then(content => {
              f.content = content;
              this.setState({files: mdFiles})
            })
        })
      });
  }
  renderFileList() {
    if (! this.state.files) {
      return <p></p>
    }
    if (this.state.files.length === 0) {
      return <p></p>
    }
    const c = this.state.currentFile;
    const handleSelect = (eventKey) => this.setState({currentFile:eventKey});
    return <Navbar bg="light">
      <Nav className="flex-column" activeKey={c} onSelect={handleSelect}>
        <Nav.Item><h5>{this.props.heading || 'Files'}</h5></Nav.Item>
        { this.state.files.map((f,i) => <Nav.Link key={i} eventKey={i}>{f.name}</Nav.Link>) }
      </Nav>
    </Navbar>
  }
  renderFile() {
    if (! this.state.files) {
      return <p>{this.props.ifEmpty || `No matching files found in ${this.props.org}/${this.props.repo}/${this.props.path}`}</p>
    }
    if (this.state.files.length === 0) {
      return <p>no files found in <code>{`https://github.com/${this.props.org}/${this.props.repo}/${this.props.path}`}</code></p>
    }
    const c = this.state.currentFile;
    const f = this.state.files[c];
    return <div className='mdview'>
      { f.content && <Remark
        remarkPlugins={[
            remarkGfm,
            remarkHeading,
            [imgLinks, { absolutePath: `https://github.com/${this.props.org}/${this.props.repo}/raw/main/${this.props.path}/`}]
        ]}
        rehypeReactOptions={{
          components: {
            table: props => <Table size="sm" striped bordered hover {...props} />
          }
        }}
      >{f.content}</Remark>
      }
    </div>
  }
  render() {
    return <Container fluid>
      <Row>
        <Col sm={3}>{ this.renderFileList()}</Col>
        <Col sm={9}>{ this.renderFile() }</Col>
      </Row>
    </Container>
  }
}
