class AppInterface extends React.Component {
  constructor(props) {
    //console.log(props)
    super(props)
    this.state = {
      dotSrc: this.props.dotSrc,
      markovBlanketSelected: this.props.markovBlanketSelected
    }
    this.sendData = this.sendData.bind(this)
  }

  componentDidMount() {
  }

  componentDidUpdate() {
  }

  sendData(url, dataToSend) {
    console.log(dataToSend)
    fetch(url, {
      method: 'POST',
      body: JSON.stringify(dataToSend)
    }).then(function(response) {
      return response.json();
    }).then(data =>
      //console.log(data)
      this.updateData(data)
    ).catch(function(error) {
      console.log(error)
    })
  }

  updateData(data) {
    console.log(data)
    this.setState({
      dotSrc: data.dotSrc,
      markovBlanketSelected: data.markovBlanketSelected
    })
  }

  render(){
    console.log('app')
    return (
      <div>
        <CausalGraph
          dotSrc={this.state.dotSrc}
          sendData={this.sendData}
          markovBlanketSelected={this.state.markovBlanketSelected}/>
      </div>
    )
  }
}
