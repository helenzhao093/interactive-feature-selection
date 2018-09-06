/*** @jsx React.DOM */
// 4 buttons - one for each component type and a zoom button that enables zoom

function Button(props) {
  console.log('render button')
  return (
    <button onClick={props.onClick}>{props.text}</button>
  )
}

class Settings extends React.Component {
  constructor(props) {
    console.log(props)
    super(props)
    this.state = {
      classifications: Object.keys(props.display)
    }
  }

  componentDidMount() {
  }

  componentDidUpdate() {
  }

  render(){
    console.log('render settings');
    return (
      <div className={"histogram-buttons"}>
        {this.state.classifications.map((classification) =>
          <Button onClick={() => this.props.onClick(classification)}
            display={this.props.display[classification]}
            text={classification} />
          )
        }
      </div>
    )
  }
}
/*
this.state.classifications.map((classification) =>
  <Button onClick={() => this.props.onClick(classification)}
    display={this.props.display[classification]}
    text={classification} />*/
