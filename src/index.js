import React, {Component} from 'react'
import remarkGfm from 'remark-gfm'
import {Remark} from 'react-remark'
import remarkHeading from 'remark-heading-id'
import imgLinks from '@pondorasti/remark-img-links'
import {Table} from 'react-bootstrap'
import SidebarMenu from 'react-bootstrap-sidebar-menu'
import "../css/styles.css"
import "../css/mdview.css"

const find_and_scroll = (eventKey) => {
  if (eventKey){
    const el = document.getElementById(`mdView-${eventKey}`)
    if (el) {
      el.scrollIntoView({behavior: 'smooth'});
      const nextURL = `${window.location.origin}${window.location.pathname}?section=${eventKey}`;
      const nextTitle = `${window.location.host} section ${eventKey}`;
      const nextState = { additionalInformation: 'updated the URL based on click' };
      window.history.pushState(nextState, nextTitle, nextURL);
      return true;
    }
  }
  return false;
}
export default class extends Component {
  constructor(props) {
    super(props);
    this.state = {
      files:[],
      content:{}
    }
  }
  getFiles(path) {
    const md_regex = /---[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]/i; //\.md$/i;
    const url = `https://api.github.com/repos/${this.props.org}/${this.props.repo}/contents/${path}`;
    const now = this.props.date ? new Date(this.props.date) : new Date();
    return fetch(url)
      .then(response => response.json())
      .then(data => data.filter(f => md_regex.test(f.name))
        .map(f => {
          f.name = f.name.replace(/\.[^/.]+$/, "");
          const [name,datestr] = f.name.split('---');
          f.name = name;
          f.date = new Date(datestr);
          f.fetched = false;
          f.parent = path;
          f.id = f.path.replace(/.*?\//,'').replace(/---\d+-\d+-\d+/g,'').replace(/\.md$/,'')
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
        })
      )
  }
  getContent() {
    const files = this.state.files;
    let fetching = false;
    files.forEach(f => {
      if (f.download_url && !f.fetched && !this.state.content.hasOwnProperty(f.sha)) {
        fetching = true;
        f.fetched = true;
        fetch(f.download_url)
          .then(response => response.text())
          .then(text => {
            let content = this.state.content;
            if (!content.hasOwnProperty(f.sha)) {
              content[f.sha] = text;
              this.setState({content})
            }
          })
      }
      if (f.type === "dir" && !f.fetched) {
        fetching = true;
        f.fetched = true;
        this.getFiles(f.path).then(children => {
          if (children) {
            const files = this.state.files.concat(children)
            this.setState({files})
          }
        })
      }
    })
    if (fetching) {
      this.setState({files})
    }
  }
  componentDidMount() {
    const queryString = window.location.search;
    const params = new URLSearchParams(queryString);
    const section = params.get('section');
    this.getFiles(this.props.path).then(files => {
      this.setState({files, currentPos: section})
    });
  }
  componentDidUpdate() {
    console.log('update',this.state);
    this.getContent()
    find_and_scroll(this.state.currentPos);
  }
  renderItems(path,prefix) {
    return <SidebarMenu.Nav> {
      this.state.files.filter(f => f.parent === path).map((f, i) => {
        const fileId = prefix.concat([i+1]).join('.');
        if (f.type === 'file') {
          return <SidebarMenu.Nav.Link eventKey={f.id} key={i}>
            <span style={{paddingLeft: `${prefix.length * 35}px`}}>
              <SidebarMenu.Nav.Icon>&bull;</SidebarMenu.Nav.Icon>
              <SidebarMenu.Nav.Title>{f.name}</SidebarMenu.Nav.Title>
            </span>
          </SidebarMenu.Nav.Link>
        }
        if (f.type === 'dir') {
          return <SidebarMenu.Sub eventKey={f.id} key={i} defaultExpanded={true}>
            <SidebarMenu.Sub.Toggle>
              <SidebarMenu.Nav.Icon />
              <SidebarMenu.Nav.Title>{f.name}</SidebarMenu.Nav.Title>
            </SidebarMenu.Sub.Toggle>
            <SidebarMenu.Sub.Collapse>
              {this.renderItems(f.path, prefix.concat([i+1]))}
            </SidebarMenu.Sub.Collapse>
          </SidebarMenu.Sub>
        }
      })
    }
    </SidebarMenu.Nav>
  }
  renderContent(path, prefix) {
    return this.state.files.filter(f => f.parent === path).map((f,i) => {
        const fileId = prefix.concat([i+1]).join('.')
        if (f.type === 'file') {
          const content = this.state.content[f.sha]
          return <div><h5 className="mdview-body-section" id={`mdView-${f.id}`}>{f.name}</h5> {
            content && <Remark
              ref={this.docRef}
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
            >{content}</Remark>
          }</div>
        }
        else {
          return <div>
            <h4 className="mdview-body-section" id={f.id}>{f.name}</h4>
            {this.renderContent(f.path, prefix.concat([i+1]))}
          </div>
        }
      })
  }
  renderSidebar() {
    return <SidebarMenu
      variant="dark"
      bg="dark"
      expand="lg"
      hide="md"
      onSelect={eventKey => {
        if (find_and_scroll(eventKey) && eventKey !== this.state.currentPos)
          this.setState({currentPos: eventKey})
      }}
    >
      <SidebarMenu.Collapse>
        <SidebarMenu.Header>
          <SidebarMenu.Brand title={this.props.heading || 'Docs'}>{this.props.heading || 'Docs'}</SidebarMenu.Brand>
          {/*<SidebarMenu.Toggle />*/}
        </SidebarMenu.Header>
        <SidebarMenu.Body>
          {this.renderItems(this.props.path,[])}
        </SidebarMenu.Body>
      </SidebarMenu.Collapse>
    </SidebarMenu>
  }
  sidebar() {
    return <section className="mdview-sidebar" style={{height: `calc(100vh - ${this.props.offset || 0}px)`}}>
      {this.renderSidebar()}
    </section>
  }
  content() {
    return <section className="mdview-body">
      <div className="mdview-body-wrapper">
        {this.renderContent(this.props.path, [])}
      </div>
    </section>
  }
  render() {
    return <div className="mdview-container" style={{gridTemplateRows: `calc(100vh - ${this.props.offset || 0}px)`}}>
      {this.sidebar()}
      {this.content()}
    </div>
  }
}
