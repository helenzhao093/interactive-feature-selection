class AppInterface extends React.Component {
  constructor(props) {
    console.log(props)
    super(props)
    var colorRange = ["#00649b", "#bc4577", "#ff7e5a", "#b2bae4", "#c0392b", "#f1c40f", "#16a085", "#3498db", '#e88c5d', '#23a393' ]
    var color = d3.scaleOrdinal()
        .range(colorRange)
        .domain(props.classNames)

    props.featureData.features.sort(function(a, b) { return a.index - b.index })
    props.featureData.features.splice(props.markovBlanket.length, 0,
      { index: props.featureData.features.length,
        display: true,
        name: "BOUNDARY",
        type: "continuous",
        range: [0,0]
      }
    )
    this.state = {
      dotSrc: this.props.dotSrc,
      markovBlanketSelected: this.props.markovBlanketSelected,
      isEdgeSelected: this.props.isEdgeSelected,
      isNodeSelected: this.props.isNodeSelected,
      featureData:this.props.featureData,
      features: this.props.featureData.features,
      featureSchema: this.props.featureSchema,
      colorRange: colorRange,
      colorFunction: color,
      progressGraphKeys: ["Ranking consistency", "MB consistency", "Mutual Information"],
      progressGraphKeyColor: ["red", "green", "blue"],
      consistencyScores: { EK: [],
                           MB: [],
                           MI: []
                           } ,//[0.99, this.props.consistencyEK]
      currentScores: { EK: parseFloat(this.props.MI.toFixed(3)),
                       MB: parseFloat(this.props.consistencyMB.toFixed(3)),
                       MI: 0.22 },
      metrics: { accuracy: [],
                 precision: [] },
      featureHistory: [],
      step: 0
    }
    this.sendData = this.sendData.bind(this)
    this.handleClassSelection = this.handleClassSelection.bind(this)
    this.classify = this.classify.bind(this)
    this.goToStep = this.goToStep.bind(this)
    console.log(this.state)
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
    var keys = Object.keys(data)
    //console.log(this.state.consistencyMB)
    //console.log(data.consistencyMB.toFixed(3))
    if (keys.includes("featureData")) {
      this.setState({
        featureData: data.featureData
      })
    } else {
      //var currentMB = this.state.consistencyMB.splice(0, this.state.consistencyMB.length)
      //var currentMI = this.state.MI.splice(0, this.state.MI.length)
      //var currentEK = this.state.consistencyEK.splice(0, this.state.consistencyEK.length)
      //if (keys.includes("featureData")){
      //currentMB.push()
      //currentMI.push()
      //currentEK.push(0.5)
      this.setState({
        currentScores: {
          MB: parseFloat(data.consistencyMB.toFixed(3)),
          MI: parseFloat(data.MI.toFixed(3)),
          EK: 0.5
        }
      })
    }
  }

  classify() {

    const allFeatureNames = this.state.featureData.features.map((feature) =>
      feature.name
    )
    const stopIndex = allFeatureNames.indexOf("BOUNDARY");
    console.log(stopIndex)
    allFeatureNames.splice(stopIndex)
    const features = { "features": allFeatureNames }
    fetch('/classify', {
      method: 'POST',
      body: JSON.stringify(features)
    }).then(function(response) {
      return response.json();
    }).then(data => {
      console.log(data)
      var currentFeatureHistory = this.state.featureData.features.slice()
      this.state.featureHistory.push(currentFeatureHistory)
      console.log(this.state.featureHistory)
      var keys = Object.keys(this.state.consistencyScores)
      keys.forEach((key) =>
        this.state.consistencyScores[key].push(this.state.currentScores[key])
      )
      console.log(this.state.consistencyScores)
      this.state.metrics.precision.push(parseFloat(data.precision.toFixed(3)))
      this.state.metrics.accuracy.push(parseFloat(data.accuracy.toFixed(3)))
      this.setState({
        consistencyScores: this.state.consistencyScores,
        currentScores: {
          MI: -1,
          MB: -1,
          EK: -1
        },
        metrics: {
          precision: this.state.metrics.precision,
          accuracy: this.state.metrics.accuracy
        },
        featureHistory: this.state.featureHistory
      })
    }).catch(function(error) {
      console.log(error)
    })
  }

  goToStep(step) {
    var featureHistory = this.state.featureHistory
    this.state.featureHistory.splice(step + 1)
    console.log(step)
    console.log(this.state.featureHistory)
    var previousFeatures = this.state.featureHistory[this.state.featureHistory.length - 1]
    //console.log(features)
    var xScaleDomain = previousFeatures.map((feature) =>
      feature.name
    )
    this.setState({
       features: previousFeatures,
    })
  }

  handleClassSelection(className, currentDisplay){
    console.log(className, currentDisplay)
    this.sendData("/classSelected", { "className": className, "currentDisplay": currentDisplay })
  }

  render(){
    console.log('app')
    let metricsGraph;
    let metricsLegend;
    if (this.state.metrics.precision.length > 0) {
      metricsGraph = <ProgressGraph size={[500,300]}
      name={"metrics"}
      consistencyScores={this.state.metrics}
      colors={["orange", "blue"]}
      />
      metricsLegend = <Legend keys={Object.keys(this.state.metrics)} colors={["orange", "blue"]} />

    } else {
      metricsGraph = <div></div>
      metricsLegend = <div></div>
    }

    return (
      <div>
      <div className={"row"}>
        <ExpertKnowledge
          featureSchema={this.state.featureSchema}
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
          <div className={"column-left"}>
            <div style={{width: "100%", height: 20}}>
              <CheckboxMultiSelect options={this.state.featureData.classDisplay} handleChange={(c,d) => this.handleClassSelection(c,d)} />
            </div>
            <Legend keys={["N", "P", "S"]} colors={this.state.progressGraphKeyColor}/>
            <div style={{width: "100%", height: 20}}>
              <button onClick={this.classify}>{"Classify"}</button>
            </div>
            <FeatureParallelCoordinates
              data={this.state.featureData.inputData}
              features={this.state.features}
              size={[900,500]}
              sendData={this.sendData}
              colorFunction={this.state.colorFunction}
              markovBlanket={this.props.markovBlanket}
              />
          </div>
          <div className={"column"}>
            <ProgressGraph size={[500,300]}
              name={"consistency"}
              consistencyScores={this.state.consistencyScores}
              currentScores={this.state.currentScores}
              colors={this.state.progressGraphKeyColor}
              goToStep={(s) => this.goToStep(s)}
              />
            <Legend keys={this.state.progressGraphKeys} colors={this.state.progressGraphKeyColor}/>
          </div>
        </div>
        <div className={"row"}>
          <div className={"column-left"}>
            {metricsGraph}
            {metricsLegend}
          </div>
        </div>
      </div>
    )
  }
}
