class AppInterface extends React.Component {
  constructor(props) {
    super(props);
    var colorRange = ["#00649b", "#bc4577", "#ff7e5a", "#b2bae4", "#c0392b", "#f1c40f", "#16a085", "#3498db", '#e88c5d', '#23a393' ];
    var color = d3.scaleOrdinal()
        .range(colorRange)
        .domain(props.classNames);

    props.featureData.features.sort(function(a, b) { return a.index - b.index });
    props.featureData.features.splice(props.markovBlanket.length, 0,
      { index: props.featureData.features.length,
        display: true,
        name: "BOUNDARY",
        type: "continuous",
        range: [0,0]
      }
    );

    var features = {}
    props.featureSchema.sort(function (a,b) { return a.index - b.index })
    props.featureSchema.map(feature => {
        feature.rank = 0;
        features[feature.index] = feature;
    })
    console.log(features)

    var featureCoordinatesSize = [1000,500];
    var xScaleRange = props.featureData.features.map((feature, index) =>
      featureCoordinatesSize[0]/(props.featureData.features.length - 1) * index
    );
    var xScaleDomain = props.featureData.features.map((feature, index) =>
      feature.name
    );
    var xScale = d3.scaleOrdinal()
        .domain(xScaleDomain)
        .range(xScaleRange);
    //console.log(xScaleRange)

    this.props.featureSchema.map((feature) =>
        feature.rank = 0
    )

    this.state = {
      dotSrc: this.props.dotSrc,
      markovBlanketSelected: this.props.markovBlanketSelected,
      isEdgeSelected: this.props.isEdgeSelected,
      isNodeSelected: this.props.isNodeSelected,
      featureData:this.props.featureData,
      features: this.props.featureData.features,
      xScaleDomain: xScaleDomain,
      xScale: xScale,
      featureCoordinatesSize: featureCoordinatesSize,
      featureSchema:features,
      dragging: {},
      colorRange: colorRange,
      colorFunction: color,
      selectedIndex: 0,
      progressGraphKeys: ["Ranking consistency", "MB consistency", "Mutual Information"],
      progressGraphKeyColor: ["red", "green", "blue"],
      xAxisLength: 2,
      consistencyScores: { EK: [],
                           MB: [],
                           MI: []
                           } ,//[0.99, this.props.consistencyEK]
      currentScores: { EK: 0.22,
                       MB: parseFloat(this.props.consistencyMB.toFixed(3)),
                       MI: parseFloat(this.props.MI.toFixed(3)) },
      metrics: { accuracy: [],
                 precision: [] },
      featureHistory: [],
      step: 0,
      histogramHistory: [],
      histogramUpdateStep: -1,
      currentHistogramHistory: [],
      currentHistogramStep: -1,
      histogramSize: [300,300],
      margin: {top: 5, right: 5, bottom: 15, left: 0},
    };
    this.sendData = this.sendData.bind(this);
    this.handleClassSelection = this.handleClassSelection.bind(this);
    this.classify = this.classify.bind(this);
    this.goToStep = this.goToStep.bind(this);
    this.position = this.position.bind(this);
    this.featureAxisOnEnd = this.featureAxisOnEnd.bind(this);
    this.updateIndex = this.updateIndex.bind(this);
    this.histogramSettingSelection = this.histogramSettingSelection.bind(this)
    this.updateFeatureRank = this.updateFeatureRank.bind(this)
    console.log(this.state)
  }

  componentDidMount() {
  }

  componentDidUpdate() {
  }

  sendData(url, dataToSend) {
    console.log(dataToSend);
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
    console.log(data);
    var keys = Object.keys(data);
    //console.log(this.state.consistencyMB)
    //console.log(data.consistencyMB.toFixed(3))
    if (keys.includes("featureData")) {
      this.setState({
        featureData: data.featureData
      })
    } else if(keys.includes("histogramData")) {
        const currentHistogramHistory = this.state.currentHistogramHistory.splice(0, this.state.currentHistogramStep + 1)
        this.setState({
            currentHistogramHistory: currentHistogramHistory.concat([{data: data.histogramData }]),
            currentHistogramStep: currentHistogramHistory.length
        })

    } else {
      var axisLength = this.state.xAxisLength;
      if (this.state.consistencyScores.MB.length >= 2 && this.state.currentScores.MB == -1) {

        axisLength = axisLength + 1
      }
      console.log(axisLength);
      this.setState({
        currentScores: {
          MB: parseFloat(data.consistencyMB.toFixed(3)),
          MI: parseFloat(data.MI.toFixed(3)),
          EK: 0.5
        },
        xAxisLength: axisLength,
      })
    }
  }

  classify() {
    if (this.state.currentScores.MI >= 0) {

      // names of features in feature set
      const allFeatureNames = this.state.featureData.features.map((feature) =>
        feature.name
      );
      const stopIndex = allFeatureNames.indexOf("BOUNDARY");
      allFeatureNames.splice(stopIndex);

      // feature set ranking
      var featureRank = {}
      Object.keys(this.state.featureSchema).map(key =>
        featureRank[this.state.featureSchema[key].name] = this.state.featureSchema[key].rank
      )

      const features = { "features": allFeatureNames , "featureRank" : featureRank};
      fetch('/classify', {
        method: 'POST',
        body: JSON.stringify(features)
      }).then(function(response) {
        return response.json();
      }).then(data => {
        console.log(data);
        const currentHistogramHistory = this.state.histogramHistory.splice(0, this.state.histogramUpdateStep + 1)
        var currentFeatureHistory = this.state.featureData.features.slice();
        this.state.featureHistory.push(currentFeatureHistory);
        console.log(this.state.featureHistory);
        var keys = Object.keys(this.state.consistencyScores);
        keys.forEach((key) =>
          this.state.consistencyScores[key].push(this.state.currentScores[key])
        );
        console.log(this.state.consistencyScores);
        this.state.metrics.precision.push(parseFloat(data.precision.toFixed(3)));
        this.state.metrics.accuracy.push(parseFloat(data.accuracy.toFixed(3)));
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
          featureHistory: this.state.featureHistory,
          histogramHistory: currentHistogramHistory.concat([ {data: data.histogramData }]),
          histogramUpdateStep: currentHistogramHistory.length,
          currentHistogramHistory: [ { data: data.histogramData }],
          currentHistogramStep: 0
        })
      }).catch(function(error) {
        console.log(error)
      })
    }
  }

  updateIndex(index) {
    this.setState({
      selectedIndex: index
    })
  }

  position(d) {
    var value = this.state.dragging[d];
    var a = value == null ? this.state.xScale(d) : value;
    //console.log(a)
    return value == null ? this.state.xScale(d) : value;
  }


  featureAxisOnEnd(element) {
    var that = this;
    var attrId = element.id;
    var stringId = '#' + attrId;
    d3.selectAll('.feature-parallels').select(stringId).attr('transform', function(d) { return 'translate(' + that.state.xScale(attrId) + ")" });
    this.state.dragging[attrId] = d3.event.x;
    var oldFeatureNames = this.state.features.map((feature) =>
      feature.name
    );
    var features = this.state.features;
    features.sort(function(a, b) { return that.position(a.name) - that.position(b.name)});
    var allFeatureIndexes = features.map((feature) =>
      feature.index
    );
    var allFeatureNames = features.map((feature) =>
      feature.name
    );
    delete this.state.dragging[attrId];
    if (JSON.stringify(oldFeatureNames) != JSON.stringify(allFeatureNames)) {
      d3.selectAll('.feature-node').classed("ek-selected", false);
      const stopIndex = allFeatureIndexes.indexOf(features.length - 1);
      allFeatureIndexes.splice(stopIndex);
      allFeatureNames.splice(stopIndex);
      var xScaleDomain = features.map((feature, index) =>
        feature.name
      );

      /*var EK = d3.select('#expert-knowledge')
      allFeatureIndexes.map(index => {
        var stringId = '#' + index
        EK.select(stringId).raise().classed("ek-selected", true)
      })*/

      var xScale = this.state.xScale.domain(xScaleDomain);

      // feature rank
      var featureRank = {}
      Object.keys(this.state.featureSchema).map(key =>
          featureRank[this.state.featureSchema[key].name] = this.state.featureSchema[key].rank
      )

      this.sendData("/calculateScores", { features: allFeatureIndexes, names: allFeatureNames, featureOrder: features, featureRank: featureRank });
      this.setState({
          xScale: xScale,
          xScaleDomain: xScaleDomain,
          features: features
        })
    }
  }

  goToStep(step) {
    //var featureHistory = this.state.featureHistory
    //this.state.featureHistory.splice(step + 1)
    //console.log(step)
    var currentHistogramHistory = this.state.histogramHistory[step]
    console.log(currentHistogramHistory)
    console.log(this.state.featureHistory);
    var previousFeatures = this.state.featureHistory[step];
    //console.log(features)
    var xScaleDomain = previousFeatures.map((feature) =>
      feature.name
    );
    var xScale = this.state.xScale.domain(xScaleDomain);
    this.setState({
        features: previousFeatures,
        xScale: xScale,
        xScaleDomain: xScaleDomain,
        currentHistogramHistory: [{data: currentHistogramHistory.data }],
        currentHistogramStep: 0
    })
  }

  handleClassSelection(className, currentDisplay){
    console.log(className, currentDisplay);
    this.sendData("/classSelected", { "className": className, "currentDisplay": currentDisplay })
  }

    histogramSettingSelection(classification, display) {
      console.log('clicked settings')
        this.sendData('/postHistogramDisplay',
          { "classification": classification,
            "display": display}
        )
  }

  updateFeatureRank(featureId, rank) {
    console.log(featureId, rank)
    this.state.featureSchema[featureId].rank = rank
  }

  render() {
      console.log('app');
      let metricsGraph;
      let metricsLegend;
      if (this.state.metrics.precision.length > 0) {
          metricsGraph = <ProgressGraph size={[500, 300]}
                                        name={"metrics"}
                                        consistencyScores={this.state.metrics}
                                        colors={["orange", "blue"]}
                                        selectedIndex={this.state.selectedIndex}
                                        updateIndex={this.updateIndex}
                                        xAxisLength={this.state.xAxisLength}
                                        goToStep={(s) => this.goToStep(s)}
          />;
          metricsLegend = <Legend keys={Object.keys(this.state.metrics)} colors={["orange", "blue"]}/>

      } else {
          metricsGraph = <div></div>;
          metricsLegend = <div></div>
      }

      const currentHistogramData = (this.state.currentHistogramStep >= 0) ?
          this.state.currentHistogramHistory[this.state.currentHistogramStep] :
          {};

      let histograms;
      let settings;
      if (this.state.currentHistogramStep > -1) {
          histograms = currentHistogramData.data.HistogramData.map((data, index) =>
              <Histogram data={data} max={currentHistogramData.data.range[0]} min={currentHistogramData.data.range[1]}
                         size={this.state.histogramSize} margin={this.state.margin}
                         maxNeg={currentHistogramData.data.maxNeg} maxPos={currentHistogramData.data.maxPos}
                         index={index}
                         colorRange={this.state.colorRange}
                         colorFunction={this.state.colorFunction}
                         index={index}
              />)
          settings = <Settings display={currentHistogramData.data.display}
                               onClick={(c, d) => this.histogramSettingSelection(c, d)}/>
      }
      else {
          histograms = <div></div>
          settings = <div></div>
      }


      return (
          <Tabs>

              <Tab linkClassName={"Importance"}>
                  <ExpertKnowledge
                      featureSchema={this.state.featureSchema}
                      updateFeatureRank={(r, f) => this.updateFeatureRank(r, f)}
                      width={500}
                      height={500}
                  />
              </Tab>
              <Tab linkClassName={"Causal Graph"}>
                  <CausalGraph
                      dotSrc={this.state.dotSrc}
                      sendData={this.sendData}
                      graph={this.props.graph}
                      markovBlanketSelected={this.state.markovBlanketSelected}
                      isEdgeSelected={this.state.isEdgeSelected}
                      isNodeSelected={this.state.isNodeSelected}/>
              </Tab>
              <Tab linkClassName={"Selection"}>
                  <div>
                      <div style={{width: "100%", height: 20}}>
                          <CheckboxMultiSelect options={this.state.featureData.classDisplay}
                                               handleChange={(c, d) => this.handleClassSelection(c, d)}/>
                      </div>
                      <Legend keys={["N", "P", "S"]} colors={this.state.progressGraphKeyColor}/>
                      <div style={{width: "100%", height: 20}}>
                          <button onClick={this.classify}>{"Classify"}</button>
                      </div>
                      <FeatureParallelCoordinates
                          data={this.state.featureData.inputData}
                          features={this.state.features}
                          xScaleDomain={this.state.xScaleDomain}
                          xScale={this.state.xScale}
                          dragging={this.state.dragging}
                          featureAxisOnEnd={this.featureAxisOnEnd}
                          size={this.state.featureCoordinatesSize}
                          sendData={this.sendData}
                          colorFunction={this.state.colorFunction}
                          markovBlanket={this.props.markovBlanket}
                      />
                  </div>
              </Tab>
              <Tab linkClassName={"Metrics Graph"}>
                  <div className={"column"}>
                      <ProgressGraph size={[500, 300]}
                                     name={"consistency"}
                                     consistencyScores={this.state.consistencyScores}
                                     currentScores={this.state.currentScores}
                                     colors={this.state.progressGraphKeyColor}
                                     selectedIndex={this.state.selectedIndex}
                                     updateIndex={this.updateIndex}
                                     xAxisLength={this.state.xAxisLength}
                                     goToStep={(s) => this.goToStep(s)}
                      />
                      <Legend keys={this.state.progressGraphKeys} colors={this.state.progressGraphKeyColor}/>
                  </div>
              </Tab>
              <Tab linkClassName={"Results"}>
                  <div className={"column-left"}>
                      {metricsGraph}
                      {metricsLegend}
                  </div>
              </Tab>
              <Tab linkClassName={"Histograms"}>
                  <div className={"column"}>
                      {settings}
                      {histograms}
                  </div>
              </Tab>
          </Tabs>
      )
  }
}
