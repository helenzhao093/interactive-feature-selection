class AppInterface extends React.Component {
  constructor(props) {
    //console.log(props)
    super(props)
    var colorRange = ["#00649b", "#bc4577", "#ff7e5a", "#b2bae4", "#c0392b", "#f1c40f", "#16a085", "#3498db", '#e88c5d', '#23a393' ]
    var color = d3.scaleOrdinal()
        .range(colorRange)
        .domain(props.classNames)
    this.state = {
      dotSrc: this.props.dotSrc,
      markovBlanketSelected: this.props.markovBlanketSelected,
      isEdgeSelected: this.props.isEdgeSelected,
      isNodeSelected: this.props.isNodeSelected,
      featureSchema: this.props.featureSchema,
      featureData:this.props.featureData,
      colorRange: colorRange,
      colorFunction: color,
    }
    this.sendData = this.sendData.bind(this)
    this.handleClassSelection = this.handleClassSelection.bind(this)
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
      featureData: data.featureData
      //dotSrc: data.dotSrc,
      //markovBlanketSelected: data.markovBlanketSelected,
      //isEdgeSelected: data.isEdgeSelected,
      //isNodeSelected: data.isNodeSelected
    })
  }

  handleClassSelection(className, currentDisplay){
    console.log(className, currentDisplay)
    this.sendData("/classSelected", { "className": className, "currentDisplay": currentDisplay })
  }

  render(){
    console.log('app')
    return (
      <div>
        <ExpertKnowledge
          featureSchema={this.state.featureSchema}
          width={600}
          height={600}
          />
        <CausalGraph
          dotSrc={this.state.dotSrc}
          sendData={this.sendData}
          graph={this.props.graph}
          markovBlanketSelected={this.state.markovBlanketSelected}
          isEdgeSelected={this.state.isEdgeSelected}
          isNodeSelected={this.state.isNodeSelected}/>
        <CheckboxMultiSelect options={this.state.featureData.classDisplay} handleChange={(c,d) => this.handleClassSelection(c,d)} />
        <FeatureParallelCoordinates
          data={this.state.featureData.inputData}
          features={this.state.featureData.features}
          size={[1000,400]}
          colorFunction={this.state.colorFunction}/>
      </div>
    )
  }
}
