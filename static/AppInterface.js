class AppInterface extends React.Component {
  constructor(props) {
    console.log(props)
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
      featureData:this.props.featureData,
      colorRange: colorRange,
      colorFunction: color,
      MIScore: 0
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
    const keys = Object.keys(data)
    if (keys.includes("featureData")){
      this.setState({
        featureData: data.featureData,
        //MIScore: data.MIScore
      //dotSrc: data.dotSrc,
      //markovBlanketSelected: data.markovBlanketSelected,
      //isEdgeSelected: data.isEdgeSelected,
      //isNodeSelected: data.isNodeSelected
      })
    }
    if (keys.includes("MIScore")) {
      this.setState({
        MIScore: data.MIScore
      })
    }
    //}
  }

  handleClassSelection(className, currentDisplay){
    console.log(className, currentDisplay)
    this.sendData("/classSelected", { "className": className, "currentDisplay": currentDisplay })
  }

  render(){
    console.log('app')
    return (
      <div>
      <div className={"row"}>
        <ExpertKnowledge
          featureSchema={this.state.featureData.features}
          width={500}
          height={500}
          />
        <CausalGraph
          dotSrc={this.state.dotSrc}
          sendData={this.sendData}
          graph={this.props.graph}
          markovBlanketSelected={this.state.markovBlanketSelected}
          isEdgeSelected={this.state.isEdgeSelected}
          isNodeSelected={this.state.isNodeSelected}/>
        </div>
        <div className={"row"}>
          <div className={"column"}>
            <CheckboxMultiSelect options={this.state.featureData.classDisplay} handleChange={(c,d) => this.handleClassSelection(c,d)} />
            <FeatureParallelCoordinates
              data={this.state.featureData.inputData}
              features={this.state.featureData.features}
              size={[900,500]}
              sendData={this.sendData}
              colorFunction={this.state.colorFunction}
              markovBlanket={this.props.markovBlanket}/>
          </div>
          <div className={"column"}>
            <ProgressGraph size={[500,300]} consistencyEK={[0.91, 0.74, 0.23]} consistencyMB={[0.84, 0.77, 0.99]} MI={[0.77, 0.88, 0.11]}/>
          </div>
        </div>
      </div>
    )
  }
}
